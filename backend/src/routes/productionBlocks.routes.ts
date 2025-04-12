import express, { Request, Response, NextFunction } from "express";
import ProductionBlock from "../models/ProductionBlock";
import ProductionPlan from "../models/ProductionPlan";
import Recipe from "../models/Recipe";
import Machine from "../models/Machine";
import Employee from "../models/Employee";
import { Session } from "express-session";
import { Document, Types } from "mongoose";
import { 
  calculateProductionTime, 
  calculateEndTime, 
  isTimeSlotAvailable,
  suggestProductionSchedule
} from "../utils/productionTimeCalculator";

const router = express.Router();

// Extend the session interface to include our user data
declare module "express-session" {
  interface Session {
    user?: {
      id: string;
      username: string;
      lastAccess: number;
    };
  }
}

interface AuthedRequest extends Request {
  user?: Document & { _id: Types.ObjectId; username: string };
  session: Session;
}

// Auth middleware
const ensureAuth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Update last access time
    req.session.user.lastAccess = Date.now();

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Authentication error" });
  }
};

// PRODUCTION BLOCK BASIC ROUTES

// Get all production blocks (with optional filter by plan)
router.get("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const query: any = { owner: req.session.user!.id };

    // Filter by plan if planId is provided
    if (req.query.planId) {
      query.planId = req.query.planId;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.startTime = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    const blocks = await ProductionBlock.find(query)
      .sort({ startTime: 1 })
      .populate("machineId", "name")
      .populate("employeeId", "name")
      .populate("recipeId", "name")
      .populate("planId", "name")
      .exec();

    res.json(blocks);
  } catch (err) {
    console.error("Error fetching production blocks:", err);
    res.status(500).json({ message: "Error fetching production blocks" });
  }
});

// Get production block by ID
router.get("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const block = await ProductionBlock.findOne({
      _id: req.params.id,
      owner: req.session.user!.id,
    })
      .populate("machineId", "name tubCapacity")
      .populate("employeeId", "name")
      .populate("recipeId", "name")
      .populate("planId", "name")
      .exec();

    if (!block) {
      return res.status(404).json({ message: "Production block not found" });
    }

    res.json(block);
  } catch (err) {
    console.error("Error fetching production block:", err);
    res.status(500).json({ message: "Error fetching production block" });
  }
});

// Create new production block
router.post("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const {
      startTime,
      endTime,
      blockType,
      machineId,
      employeeId,
      recipeId,
      quantity,
      planId,
      notes,
    } = req.body;

    // Validate required fields
    if (
      !startTime ||
      !endTime ||
      !blockType ||
      !machineId ||
      !employeeId ||
      !planId
    ) {
      return res.status(400).json({
        message:
          "Missing required fields (startTime, endTime, blockType, machineId, employeeId, planId)",
      });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start >= end) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    // Validate block type
    const validBlockTypes = ["prep", "production", "cleaning"];
    if (!validBlockTypes.includes(blockType)) {
      return res.status(400).json({
        message: `Invalid block type. Must be one of: ${validBlockTypes.join(
          ", "
        )}`,
      });
    }

    // Validate machine exists
    const machine = await Machine.findOne({
      _id: machineId,
      owner: req.session.user!.id,
    });

    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }

    // Validate employee exists and is certified for the machine
    const employee = await Employee.findOne({
      _id: employeeId,
      owner: req.session.user!.id,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if the employee is certified for this machine
    const isCertified = employee.machineCertifications.some(
      (cert: any) => cert.machineId.toString() === machineId
    );

    if (!isCertified) {
      return res.status(400).json({
        message: "Employee is not certified for this machine",
      });
    }

    // Validate plan exists
    const plan = await ProductionPlan.findOne({
      _id: planId,
      owner: req.session.user!.id,
    });

    if (!plan) {
      return res.status(404).json({ message: "Production plan not found" });
    }

    // Check for scheduling conflicts
    const conflictCheck = await checkSchedulingConflicts(
      machineId,
      employeeId,
      start,
      end,
      req.session.user!.id
    );

    if (conflictCheck.hasConflict) {
      return res.status(409).json({
        message: "Scheduling conflict detected",
        conflicts: conflictCheck.conflicts,
      });
    }

    // Validate recipe and quantity for production blocks
    if (blockType === "production") {
      if (!recipeId) {
        return res
          .status(400)
          .json({ message: "Recipe is required for production blocks" });
      }

      if (quantity === undefined || quantity <= 0) {
        return res
          .status(400)
          .json({
            message: "Valid quantity is required for production blocks",
          });
      }

      // Validate recipe exists
      const recipe = await Recipe.findOne({
        _id: recipeId,
        owner: req.session.user!.id,
      });

      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
    }

    // Create new production block
    const newBlock = new ProductionBlock({
      startTime: start,
      endTime: end,
      blockType,
      machineId,
      employeeId,
      planId,
      notes: notes || "",
      status: "scheduled",
      createdBy: req.session.user!.id,
      createdAt: new Date(),
      owner: req.session.user!.id,
    });

    // Add recipe and quantity for production blocks
    if (blockType === "production" && recipeId) {
      newBlock.recipeId = recipeId;
      newBlock.quantity = quantity;

      // Update recipe planned production
      await Recipe.findByIdAndUpdate(recipeId, {
        $inc: { plannedProduction: quantity },
      });

      // Add or update recipe in plan
      const recipeIndex = plan.recipes.findIndex(
        (r: any) => r.recipeId.toString() === recipeId
      );

      if (recipeIndex !== -1) {
        // Recipe already in plan, update planned amount
        plan.recipes[recipeIndex].plannedAmount += quantity;
      } else {
        // Add recipe to plan
        plan.recipes.push({
          recipeId,
          plannedAmount: quantity,
          completedAmount: 0,
        });
      }

      await plan.save();
    }

    await newBlock.save();

    // Add block to production plan
    await ProductionPlan.findByIdAndUpdate(planId, {
      $push: { blocks: newBlock._id },
      lastModifiedBy: req.session.user!.id,
      lastModifiedAt: new Date(),
    });

    // Get the block with populated references
    const populatedBlock = await ProductionBlock.findById(newBlock._id)
      .populate("machineId", "name")
      .populate("employeeId", "name")
      .populate("recipeId", "name")
      .populate("planId", "name")
      .exec();

    res.status(201).json(populatedBlock);
  } catch (err) {
    console.error("Error creating production block:", err);
    res.status(500).json({ message: "Error creating production block" });
  }
});

// Update production block
router.put("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const {
      startTime,
      endTime,
      machineId,
      employeeId,
      recipeId,
      quantity,
      notes,
      status,
    } = req.body;

    // Find the existing block
    const existingBlock = await ProductionBlock.findOne({
      _id: req.params.id,
      owner: req.session.user!.id,
    });

    if (!existingBlock) {
      return res.status(404).json({ message: "Production block not found" });
    }

    // Check if the plan is completed or archived
    const plan = await ProductionPlan.findById(existingBlock.planId);
    if (plan && (plan.status === "completed" || plan.status === "archived")) {
      return res.status(400).json({
        message: "Cannot update blocks in a completed or archived plan",
      });
    }

    // Build update object
    const updateData: any = {
      lastModifiedBy: req.session.user!.id,
      lastModifiedAt: new Date(),
    };

    // Schedule changes (need conflict checking)
    let scheduleChanged = false;
    let newStartTime = existingBlock.startTime;
    let newEndTime = existingBlock.endTime;
    let newMachineId = existingBlock.machineId;
    let newEmployeeId = existingBlock.employeeId;

    if (startTime) {
      newStartTime = new Date(startTime);
      updateData.startTime = newStartTime;
      scheduleChanged = true;
    }

    if (endTime) {
      newEndTime = new Date(endTime);
      updateData.endTime = newEndTime;
      scheduleChanged = true;
    }

    if (machineId) {
      // Validate machine exists
      const machine = await Machine.findOne({
        _id: machineId,
        owner: req.session.user!.id,
      });

      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      newMachineId = machineId;
      updateData.machineId = machineId;
      scheduleChanged = true;
    }

    if (employeeId) {
      // Validate employee exists and is certified for the machine
      const employee = await Employee.findOne({
        _id: employeeId,
        owner: req.session.user!.id,
      });

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check if the employee is certified for this machine
      const machineToCheck = machineId || existingBlock.machineId;
      const isCertified = employee.machineCertifications.some(
        (cert: any) => cert.machineId.toString() === machineToCheck.toString()
      );

      if (!isCertified) {
        return res.status(400).json({
          message: "Employee is not certified for this machine",
        });
      }

      newEmployeeId = employeeId;
      updateData.employeeId = employeeId;
      scheduleChanged = true;
    }

    // Check for scheduling conflicts if schedule related fields changed
    if (scheduleChanged) {
      const conflictCheck = await checkSchedulingConflicts(
        newMachineId,
        newEmployeeId,
        newStartTime,
        newEndTime,
        req.session.user!.id,
        req.params.id // Exclude current block from conflict check
      );

      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          message: "Scheduling conflict detected",
          conflicts: conflictCheck.conflicts,
        });
      }
    }

    // Handle recipe and quantity changes for production blocks
    if (existingBlock.blockType === "production") {
      let quantityDifference = 0;

      if (quantity !== undefined && quantity !== existingBlock.quantity) {
        // Calculate difference for recipe planned production
        quantityDifference = quantity - (existingBlock.quantity || 0);
        updateData.quantity = quantity;
      }

      if (recipeId && recipeId !== existingBlock.recipeId?.toString()) {
        // Validate new recipe exists
        const recipe = await Recipe.findOne({
          _id: recipeId,
          owner: req.session.user!.id,
        });

        if (!recipe) {
          return res.status(404).json({ message: "Recipe not found" });
        }

        // Remove planned production from old recipe
        if (existingBlock.recipeId) {
          await Recipe.findByIdAndUpdate(existingBlock.recipeId, {
            $inc: { plannedProduction: -(existingBlock.quantity || 0) },
          });

          // Update plan recipes
          await updatePlanRecipe(
            existingBlock.planId,
            existingBlock.recipeId,
            -(existingBlock.quantity || 0),
            req.session.user!.id
          );
        }

        // Add planned production to new recipe
        await Recipe.findByIdAndUpdate(recipeId, {
          $inc: { plannedProduction: quantity || existingBlock.quantity || 0 },
        });

        // Update plan recipes
        await updatePlanRecipe(
          existingBlock.planId,
          recipeId,
          quantity || existingBlock.quantity || 0,
          req.session.user!.id
        );

        updateData.recipeId = recipeId;
        quantityDifference = 0; // Already handled the quantity change
      } else if (quantityDifference !== 0 && existingBlock.recipeId) {
        // Update recipe planned production with the difference
        await Recipe.findByIdAndUpdate(existingBlock.recipeId, {
          $inc: { plannedProduction: quantityDifference },
        });

        // Update plan recipes
        await updatePlanRecipe(
          existingBlock.planId,
          existingBlock.recipeId,
          quantityDifference,
          req.session.user!.id
        );
      }
    }

    // Handle status changes
    if (status && status !== existingBlock.status) {
      // Validate status
      const validStatuses = [
        "scheduled",
        "in-progress",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      updateData.status = status;

      // Handle production blocks completion
      if (
        status === "completed" &&
        existingBlock.blockType === "production" &&
        existingBlock.recipeId
      ) {
        // Get the actual quantity or use planned quantity
        const actualQuantity =
          req.body.actualQuantity || existingBlock.quantity || 0;
        updateData.actualQuantity = actualQuantity;

        // Add to recipe inventory
        await Recipe.findByIdAndUpdate(existingBlock.recipeId, {
          $inc: {
            currentInventory: actualQuantity,
            plannedProduction: -(existingBlock.quantity || 0), // Remove from planned
          },
        });

        // Update completed amount in the plan
        await updatePlanRecipeCompletion(
          existingBlock.planId,
          existingBlock.recipeId,
          actualQuantity,
          req.session.user!.id
        );

        // Set actual times
        updateData.actualStartTime =
          req.body.actualStartTime || existingBlock.startTime;
        updateData.actualEndTime =
          req.body.actualEndTime || existingBlock.endTime;
      }

      // Handle cancellation
      if (
        status === "cancelled" &&
        existingBlock.blockType === "production" &&
        existingBlock.recipeId
      ) {
        // Remove from recipe planned production
        await Recipe.findByIdAndUpdate(existingBlock.recipeId, {
          $inc: { plannedProduction: -(existingBlock.quantity || 0) },
        });

        // Update plan recipe
        await updatePlanRecipe(
          existingBlock.planId,
          existingBlock.recipeId,
          -(existingBlock.quantity || 0),
          req.session.user!.id
        );
      }
    }

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update actual times and quantity if provided
    if (req.body.actualStartTime) {
      updateData.actualStartTime = new Date(req.body.actualStartTime);
    }

    if (req.body.actualEndTime) {
      updateData.actualEndTime = new Date(req.body.actualEndTime);
    }

    if (
      req.body.actualQuantity !== undefined &&
      existingBlock.blockType === "production"
    ) {
      updateData.actualQuantity = req.body.actualQuantity;
    }

    // Update the block
    const updatedBlock = await ProductionBlock.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      updateData,
      { new: true }
    )
      .populate("machineId", "name")
      .populate("employeeId", "name")
      .populate("recipeId", "name")
      .populate("planId", "name")
      .exec();

    res.json(updatedBlock);
  } catch (err) {
    console.error("Error updating production block:", err);
    res.status(500).json({ message: "Error updating production block" });
  }
});

// Delete production block
router.delete("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the block
    const block = await ProductionBlock.findOne({
      _id: req.params.id,
      owner: req.session.user!.id,
    });

    if (!block) {
      return res.status(404).json({ message: "Production block not found" });
    }

    // Check if the plan is completed or archived
    const plan = await ProductionPlan.findById(block.planId);
    if (plan && (plan.status === "completed" || plan.status === "archived")) {
      return res.status(400).json({
        message: "Cannot delete blocks from a completed or archived plan",
      });
    }

    // Handle recipe planned production for production blocks
    if (block.blockType === "production" && block.recipeId) {
      // Remove from recipe planned production
      await Recipe.findByIdAndUpdate(block.recipeId, {
        $inc: { plannedProduction: -(block.quantity || 0) },
      });

      // Update plan recipes
      await updatePlanRecipe(
        block.planId,
        block.recipeId,
        -(block.quantity || 0),
        req.session.user!.id
      );
    }

    // Remove block from production plan
    await ProductionPlan.findByIdAndUpdate(block.planId, {
      $pull: { blocks: block._id },
      lastModifiedBy: req.session.user!.id,
      lastModifiedAt: new Date(),
    });

    // Delete the block
    await ProductionBlock.findOneAndDelete({
      _id: req.params.id,
      owner: req.session.user!.id,
    });

    res.status(204).end();
  } catch (err) {
    console.error("Error deleting production block:", err);
    res.status(500).json({ message: "Error deleting production block" });
  }
});

// SPECIALIZED PRODUCTION BLOCK ENDPOINTS

// Calculate production time
router.post(
  "/calculate-time",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { machineId, quantity } = req.body;

      if (!machineId || !quantity) {
        return res.status(400).json({
          message: "Machine ID and quantity are required",
        });
      }

      // Validate machine exists
      const machine = await Machine.findOne({
        _id: machineId,
        owner: req.session.user!.id,
      });

      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      const timeCalculation = await calculateProductionTime(
        machineId,
        quantity
      );

      res.json(timeCalculation);
    } catch (err) {
      console.error("Error calculating production time:", err);
      res.status(500).json({ message: "Error calculating production time" });
    }
  }
);

// Suggest production schedule
router.post(
  "/suggest-schedule",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { machineId, employeeId, quantity, preferredStartTime } = req.body;

      if (!machineId || !employeeId || !quantity || !preferredStartTime) {
        return res.status(400).json({
          message:
            "Machine ID, employee ID, quantity, and preferred start time are required",
        });
      }

      // Validate machine exists
      const machine = await Machine.findOne({
        _id: machineId,
        owner: req.session.user!.id,
      });

      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      // Validate employee exists and is certified for the machine
      const employee = await Employee.findOne({
        _id: employeeId,
        owner: req.session.user!.id,
      });

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check if the employee is certified for this machine
      const isCertified = employee.machineCertifications.some(
        (cert: any) => cert.machineId.toString() === machineId
      );

      if (!isCertified) {
        return res.status(400).json({
          message: "Employee is not certified for this machine",
        });
      }

      const schedule = await suggestProductionSchedule(
        machineId,
        employeeId,
        quantity,
        new Date(preferredStartTime),
        req.session.user!.id
      );

      res.json(schedule);
    } catch (err) {
      console.error("Error generating production schedule:", err);
      res.status(500).json({ message: "Error generating production schedule" });
    }
  }
);

// Check time slot availability
router.post(
  "/check-availability",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { machineId, employeeId, startTime, endTime, blockId } = req.body;

      if (!machineId || !employeeId || !startTime || !endTime) {
        return res.status(400).json({
          message: "Machine ID, employee ID, start time, and end time are required",
        });
      }

      const isAvailable = await isTimeSlotAvailable(
        machineId,
        employeeId,
        new Date(startTime),
        new Date(endTime),
        req.session.user!.id,
        blockId
      );

      res.json({ available: isAvailable });
    } catch (err) {
      console.error("Error checking time slot availability:", err);
      res.status(500).json({ message: "Error checking time slot availability" });
    }
  }
);

// Bulk create production blocks (prep, production, cleaning)
router.post(
  "/create-production-set",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const {
        machineId,
        employeeId,
        recipeId,
        quantity,
        planId,
        startTime,
        notes
      } = req.body;

      if (
        !machineId ||
        !employeeId ||
        !recipeId ||
        !quantity ||
        !planId ||
        !startTime
      ) {
        return res.status(400).json({
          message:
            "Missing required fields (machineId, employeeId, recipeId, quantity, planId, startTime)",
        });
      }

      // Validate plan exists
      const plan = await ProductionPlan.findOne({
        _id: planId,
        owner: req.session.user!.id,
      });

      if (!plan) {
        return res.status(404).json({ message: "Production plan not found" });
      }

      // Calculate times
      const timeCalculation = await calculateProductionTime(machineId, quantity);
      
      // Calculate block times
      const prepStartTime = new Date(startTime);
      const prepEndTime = calculateEndTime(prepStartTime, timeCalculation.recommendedPrepMinutes);
      
      const productionStartTime = prepEndTime;
      const productionEndTime = calculateEndTime(productionStartTime, timeCalculation.productionMinutes);
      
      const cleaningStartTime = productionEndTime;
      const cleaningEndTime = calculateEndTime(cleaningStartTime, timeCalculation.recommendedCleaningMinutes);
      
      // Check for scheduling conflicts
      const isAvailable = await isTimeSlotAvailable(
        machineId,
        employeeId,
        prepStartTime,
        cleaningEndTime,
        req.session.user!.id
      );
      
      if (!isAvailable) {
        return res.status(409).json({
          message: "Scheduling conflict detected",
        });
      }
      
      // Create prep block
      const prepBlock = new ProductionBlock({
        startTime: prepStartTime,
        endTime: prepEndTime,
        blockType: "prep",
        machineId,
        employeeId,
        planId,
        status: "scheduled",
        notes: notes ? `${notes} - Prep` : "Preparation block",
        createdBy: req.session.user!.id,
        createdAt: new Date(),
        owner: req.session.user!.id,
      });
      
      // Create production block
      const productionBlock = new ProductionBlock({
        startTime: productionStartTime,
        endTime: productionEndTime,
        blockType: "production",
        machineId,
        employeeId,
        recipeId,
        quantity,
        planId,
        status: "scheduled",
        notes: notes ? `${notes} - Production` : "Production block",
        createdBy: req.session.user!.id,
        createdAt: new Date(),
        owner: req.session.user!.id,
      });
      
      // Create cleaning block
      const cleaningBlock = new ProductionBlock({
        startTime: cleaningStartTime,
        endTime: cleaningEndTime,
        blockType: "cleaning",
        machineId,
        employeeId,
        planId,
        status: "scheduled",
        notes: notes ? `${notes} - Cleaning` : "Cleaning block",
        createdBy: req.session.user!.id,
        createdAt: new Date(),
        owner: req.session.user!.id,
      });
      
      // Save all blocks
      await prepBlock.save();
      await productionBlock.save();
      await cleaningBlock.save();
      
      // Add blocks to production plan
      await ProductionPlan.findByIdAndUpdate(planId, {
        $push: { 
          blocks: { 
            $each: [prepBlock._id, productionBlock._id, cleaningBlock._id] 
          } 
        },
        lastModifiedBy: req.session.user!.id,
        lastModifiedAt: new Date(),
      });
      
      // Update recipe planned production
      await Recipe.findByIdAndUpdate(recipeId, {
        $inc: { plannedProduction: quantity },
      });
      
      // Add or update recipe in plan
      await updatePlanRecipe(
        planId,
        recipeId,
        quantity,
        req.session.user!.id
      );
      
      res.status(201).json({
        message: "Production blocks created successfully",
        blocks: {
          prep: prepBlock,
          production: productionBlock,
          cleaning: cleaningBlock,
        },
      });
    } catch (err) {
      console.error("Error creating production block set:", err);
      res.status(500).json({ message: "Error creating production block set" });
    }
  }
);

// Helper Functions

// Check for scheduling conflicts
async function checkSchedulingConflicts(
  machineId: string | Types.ObjectId,
  employeeId: string | Types.ObjectId,
  startTime: Date,
  endTime: Date,
  ownerId: string,
  excludeBlockId?: string
) {
  const conflicts: any = {
    machineConflicts: [],
    employeeConflicts: [],
  };

  // Query for blocks that would conflict with this time range
  const query: any = {
    owner: ownerId,
    status: { $nin: ["completed", "cancelled"] },
    $or: [
      // Starts during another block
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };

  // Exclude the current block if we're updating
  if (excludeBlockId) {
    (query as any)["_id"] = { $ne: excludeBlockId };
  }

  // Check machine conflicts
  const machineConflicts = await ProductionBlock.find({
    ...query,
    machineId,
  })
    .populate("machineId", "name")
    .populate("planId", "name")
    .exec();

  if (machineConflicts.length > 0) {
    conflicts.machineConflicts = machineConflicts.map((conflict) => ({
      blockId: conflict._id,
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      machineName: conflict.machineId
        ? (conflict.machineId as any).name
        : "Unknown",
      planName: conflict.planId ? (conflict.planId as any).name : "Unknown",
    }));
  }

  // Check employee conflicts
  const employeeConflicts = await ProductionBlock.find({
    ...query,
    employeeId,
  })
    .populate("employeeId", "name")
    .populate("planId", "name")
    .exec();

  if (employeeConflicts.length > 0) {
    conflicts.employeeConflicts = employeeConflicts.map((conflict) => ({
      blockId: conflict._id,
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      employeeName: conflict.employeeId
        ? (conflict.employeeId as any).name
        : "Unknown",
      planName: conflict.planId ? (conflict.planId as any).name : "Unknown",
    }));
  }

  return {
    hasConflict:
      conflicts.machineConflicts.length > 0 ||
      conflicts.employeeConflicts.length > 0,
    conflicts,
  };
}

// Update recipe in production plan
async function updatePlanRecipe(
  planId: string | Types.ObjectId,
  recipeId: string | Types.ObjectId,
  quantityChange: number,
  ownerId: string
) {
  const plan = await ProductionPlan.findOne({
    _id: planId,
    owner: ownerId,
  });

  if (!plan) return;

  // Find recipe in plan
  const recipeIndex =
    plan?.recipes.findIndex(
      (r: any) => r.recipeId.toString() === recipeId.toString()
    ) ?? -1;

  if (recipeIndex !== -1 && plan.recipes[recipeIndex].plannedAmount) {
    // Update planned amount
    plan.recipes[recipeIndex].plannedAmount += quantityChange;

    // Remove recipe if planned amount is now zero or negative
    if (plan.recipes[recipeIndex].plannedAmount <= 0) {
      plan.recipes.splice(recipeIndex, 1);
    }
  } else if (quantityChange > 0 && plan) {
    // Add recipe to plan if it doesn't exist and we're adding quantity
    plan.recipes.push({
      recipeId,
      plannedAmount: quantityChange,
      completedAmount: 0,
    });
  }

  await plan.save();
}

// Update completed amount in production plan
async function updatePlanRecipeCompletion(
  planId: string | Types.ObjectId,
  recipeId: string | Types.ObjectId,
  completedQuantity: number,
  ownerId: string
) {
  const plan = await ProductionPlan.findOne({
    _id: planId,
    owner: ownerId,
  });

  if (!plan) return;

  // Find recipe in plan
  const recipeIndex =
    plan?.recipes.findIndex(
      (r: any) => r.recipeId.toString() === recipeId.toString()
    ) ?? -1;

  if (recipeIndex !== -1 && plan) {
    // Update completed amount
    plan.recipes[recipeIndex].completedAmount += completedQuantity;

    // Recalculate completion status
    let totalPlanned = 0;
    let totalCompleted = 0;

    for (const recipe of plan.recipes) {
      totalPlanned += recipe.plannedAmount || 0;
      totalCompleted += recipe.completedAmount || 0;
    }

    if (totalPlanned > 0) {
      plan.completionStatus = Math.min(
        100,
        (totalCompleted / totalPlanned) * 100
      );
    }

    await plan.save();
  }
}

export default router;
