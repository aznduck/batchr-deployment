import express, { Request, Response } from "express";
import { authenticateUser } from "../middleware/auth";
import ProductionPlan from "../models/ProductionPlan";
import ProductionBlock from "../models/ProductionBlock";
import Recipe from "../models/Recipe";
import Machine from "../models/Machine";
import Employee from "../models/Employee";
import RecipeMachineYield from "../models/RecipeMachineYield";
import { suggestProductionSchedule } from "../utils/productionTimeCalculator";
import {
  addDays,
  addMinutes,
  parseISO,
  set,
  format,
  isValid,
  getDay,
  differenceInMinutes,
} from "date-fns";

const router = express.Router();

// Define types
interface ScheduleGenerationOptions {
  planId: string;
  weekStartDate: Date;
  recipes: {
    recipeId: string | { _id?: string; id?: string };
    plannedAmount: number;
  }[];
  includePrepBlocks: boolean;
  includeCleaningBlocks: boolean;
  prepDurationMinutes: number;
  cleaningDurationMinutes: number;
  workdayStartTime: string; // Format: "HH:MM"
  workdayEndTime: string; // Format: "HH:MM"
  workDays: string[]; // Days of the week like "Monday", "Tuesday", etc.
}

interface ScheduledBlock {
  startTime: Date;
  endTime: Date;
  blockType: "prep" | "production" | "cleaning";
  day: string;
  machineId: string;
  employeeId: string;
  recipeId?: string;
  quantity?: number;
  planId: string;
}

/**
 * Generate production schedule based on recipes and machine yields
 * POST /production-scheduler/generate
 */
router.post("/generate", authenticateUser, async (req, res) => {
  try {
    console.log("DEBUG: Starting generate function");
    // Default values for scheduling parameters
    const defaultOptions = {
      includePrepBlocks: true,
      includeCleaningBlocks: true,
      prepDurationMinutes: 15,
      cleaningDurationMinutes: 15,
      workdayStartTime: "08:00",
      workdayEndTime: "17:00",
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };

    // Merge defaults with request options
    const options: ScheduleGenerationOptions = {
      ...defaultOptions,
      ...req.body,
    };

    console.log("DEBUG: Options:", options);

    // Validate plan exists
    const plan = await ProductionPlan.findOne({
      _id: options.planId,
      owner: req.session.user?.id,
    });

    if (!plan) {
      return res.status(404).json({ message: "Production plan not found" });
    }

    console.log("DEBUG: Found production plan");

    // Get available machines
    const machines = await Machine.find({
      owner: req.session.user?.id,
      status: "available", // Only use available machines
    });

    console.log(`DEBUG: Found ${machines.length} available machines`);
    machines.forEach((m, i) => {
      console.log(
        `DEBUG: Machine ${i + 1}: ID ${m._id}, name: ${m.name}, tubCapacity: ${
          m.tubCapacity
        }`
      );
    });

    if (machines.length === 0) {
      return res.status(400).json({
        message: "No available machines found for scheduling",
      });
    }

    console.log("DEBUG: Found available machines");

    // Get available employees
    const employees = await Employee.find({
      owner: req.session.user?.id,
      active: true, // Only use active employees
    });

    console.log(`DEBUG: Found ${employees.length} available employees`);
    employees.forEach((e, i) => {
      console.log(`DEBUG: Employee ${i + 1}: ID ${e._id}, name: ${e.name}`);
    });

    if (employees.length === 0) {
      return res.status(400).json({
        message: "No active employees found for scheduling",
      });
    }

    console.log("DEBUG: Found available employees");

    // Load all recipe-machine yields for the requested recipes
    const recipeIds = options.recipes.map((r) => {
      if (typeof r.recipeId === "object") {
        return r.recipeId._id || r.recipeId.id;
      } else {
        return r.recipeId;
      }
    });
    const machineIds = machines.map((m) => m._id.toString());

    const recipeYields = await RecipeMachineYield.find({
      recipeId: { $in: recipeIds },
      machineId: { $in: machineIds },
    });

    console.log(`DEBUG: Found ${recipeYields.length} recipe-machine yields`);

    // Load recipe details
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      owner: req.session.user?.id,
    });

    console.log(`DEBUG: Found ${recipes.length} recipes`);

    // Mapping for easier access
    const recipeMap = new Map(recipes.map((r) => [r._id.toString(), r]));
    const machineMap = new Map(machines.map((m) => [m._id.toString(), m]));
    const employeeMap = new Map(employees.map((e) => [e._id.toString(), e]));

    console.log("DEBUG: Created maps for recipes, machines, and employees");

    // Schedule blocks
    const scheduledBlocks: ScheduledBlock[] = [];
    const unscheduledRecipes: {
      recipeId: string;
      remainingAmount: number;
      recipeName?: string;
    }[] = [];

    console.log("DEBUG: Starting to schedule blocks");

    // Workday information
    const workdayStart = parseTimeString(options.workdayStartTime);
    const workdayEnd = parseTimeString(options.workdayEndTime);
    if (!workdayStart || !workdayEnd) {
      return res.status(400).json({ message: "Invalid workday time format" });
    }

    console.log("DEBUG: Parsed workday start and end times");

    // Convert workDays strings to day numbers (0=Sunday, 1=Monday, etc.)
    const workDaysMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const workDayNumbers = options.workDays.map((day) => workDaysMap[day]);

    console.log("DEBUG: Converted work days to day numbers");

    // Loop through each recipe and schedule production blocks
    for (const recipeRequest of options.recipes) {
      console.log(
        `DEBUG: Scheduling recipe type: ${typeof recipeRequest.recipeId}`
      );

      if (
        recipeRequest.recipeId &&
        typeof recipeRequest.recipeId === "object"
      ) {
        try {
          console.log(
            `DEBUG: Recipe ID is an object:`,
            JSON.stringify(recipeRequest.recipeId)
          );
        } catch (error) {
          console.log(
            `DEBUG: Recipe ID is an object but couldn't stringify it`
          );
        }
      }

      const { recipeId, plannedAmount } = recipeRequest;

      // Extract the string ID if recipeId is an object
      let recipeIdString: string | null = null;

      if (recipeId) {
        if (typeof recipeId === "object" && recipeId !== null) {
          // Check if it has _id property (MongoDB/Mongoose document)
          const recipeObject = recipeId as any;
          if (recipeObject._id) {
            recipeIdString = recipeObject._id.toString();
            console.log(
              `DEBUG: Extracted recipe ID from object: ${recipeIdString}`
            );
          } else if (recipeObject.id) {
            recipeIdString = recipeObject.id.toString();
            console.log(
              `DEBUG: Extracted recipe ID from object using id: ${recipeIdString}`
            );
          }
        } else {
          // It's already a string ID
          recipeIdString = recipeId.toString();
          console.log(
            `DEBUG: Recipe ID is already a string: ${recipeIdString}`
          );
        }
      } else {
        console.log(`DEBUG: Recipe ID is null or undefined`);
      }

      // Get recipe details
      const recipe = recipeIdString ? recipeMap.get(recipeIdString) : null;
      if (!recipe) {
        unscheduledRecipes.push({
          recipeId: recipeIdString || "", // Use empty string as fallback
          remainingAmount: plannedAmount,
          recipeName: "Unknown Recipe",
        });
        continue;
      }

      console.log(`DEBUG: Found recipe ${recipeIdString}`);

      // Find the best machine for this recipe - only call if we have a valid string ID
      const bestMatch = recipeIdString
        ? findBestMachineForRecipe(recipeIdString, recipeYields, machines)
        : null;

      if (!bestMatch) {
        unscheduledRecipes.push({
          recipeId: recipeIdString || "", // Use empty string as fallback
          remainingAmount: plannedAmount,
          recipeName: recipe.name,
        });
        continue;
      }

      console.log(`DEBUG: Found best machine for recipe ${recipeIdString}`);

      const { machineId, tubsPerBatch, productionTimeMinutes } = bestMatch;

      // Calculate how many batches needed
      const batchesNeeded = Math.ceil(plannedAmount / tubsPerBatch);

      // Total production time needed
      const totalProductionMinutes = batchesNeeded * productionTimeMinutes;

      // Add prep and cleaning time if requested
      const totalBlockTimeNeeded =
        totalProductionMinutes +
        (options.includePrepBlocks ? options.prepDurationMinutes : 0) +
        (options.includeCleaningBlocks ? options.cleaningDurationMinutes : 0);

      console.log(
        `DEBUG: Calculated total block time needed for recipe ${recipeIdString}`
      );

      // Find available time slots
      const availableSlots = findAvailableTimeSlots(
        options.weekStartDate,
        workDayNumbers,
        workdayStart,
        workdayEnd,
        totalBlockTimeNeeded,
        scheduledBlocks,
        machineId
      );

      if (availableSlots.length === 0) {
        // Couldn't schedule this recipe
        unscheduledRecipes.push({
          recipeId: recipeIdString || "", // Use empty string as fallback
          remainingAmount: plannedAmount,
          recipeName: recipe.name,
        });
        continue;
      }

      console.log(
        `DEBUG: Found available time slots for recipe ${recipeIdString}`
      );

      // Use the first available slot
      const slot = availableSlots[0];
      let currentTime = new Date(slot.startTime);

      // Create prep block if requested
      if (options.includePrepBlocks) {
        const prepEndTime = addMinutes(
          currentTime,
          options.prepDurationMinutes
        );

        scheduledBlocks.push({
          startTime: currentTime,
          endTime: prepEndTime,
          blockType: "prep",
          day: format(currentTime, "EEEE"),
          machineId,
          employeeId: findAvailableEmployee(
            employees,
            scheduledBlocks,
            currentTime,
            prepEndTime
          ),
          planId: options.planId,
        });

        currentTime = prepEndTime;
      }

      console.log(`DEBUG: Created prep block for recipe ${recipeIdString}`);

      // Create production block
      const productionEndTime = addMinutes(currentTime, totalProductionMinutes);

      scheduledBlocks.push({
        startTime: currentTime,
        endTime: productionEndTime,
        blockType: "production",
        day: format(currentTime, "EEEE"),
        machineId,
        employeeId: findAvailableEmployee(
          employees,
          scheduledBlocks,
          currentTime,
          productionEndTime
        ),
        recipeId: recipeIdString || "", // Use empty string as fallback
        quantity: plannedAmount,
        planId: options.planId,
      });

      currentTime = productionEndTime;

      console.log(
        `DEBUG: Created production block for recipe ${recipeIdString}`
      );

      // Create cleaning block if requested
      if (options.includeCleaningBlocks) {
        const cleaningEndTime = addMinutes(
          currentTime,
          options.cleaningDurationMinutes
        );

        scheduledBlocks.push({
          startTime: currentTime,
          endTime: cleaningEndTime,
          blockType: "cleaning",
          day: format(currentTime, "EEEE"),
          machineId,
          employeeId: findAvailableEmployee(
            employees,
            scheduledBlocks,
            currentTime,
            cleaningEndTime
          ),
          planId: options.planId,
        });
      }

      console.log(`DEBUG: Created cleaning block for recipe ${recipeIdString}`);
    }

    console.log("DEBUG: Finished scheduling blocks");

    // Create the production blocks in the database
    const createdBlocks = [];

    for (const block of scheduledBlocks) {
      const newBlock = new ProductionBlock({
        ...block,
        status: "scheduled",
        createdBy: req.session.user?.id,
        createdAt: new Date(),
        owner: req.session.user?.id,
      });

      await newBlock.save();
      createdBlocks.push(newBlock);

      // Add the block to the plan
      plan.blocks.push(newBlock._id);
    }

    console.log("DEBUG: Created production blocks in database");

    // Update the production plan with the blocks
    await plan.save();

    console.log("DEBUG: Updated production plan");

    res.status(200).json({
      success: true,
      message: `Generated ${createdBlocks.length} production blocks`,
      blocks: createdBlocks,
      unscheduledRecipes:
        unscheduledRecipes.length > 0 ? unscheduledRecipes : undefined,
    });
  } catch (err) {
    console.error("Error generating production schedule:", err);
    res.status(500).json({
      success: false,
      message: "Error generating production schedule",
    });
  }
});

// Helper function to parse time strings like "08:00" into minutes since midnight
function parseTimeString(timeString: string): number | null {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

// Find the best machine for a recipe based on yields and capacity
function findBestMachineForRecipe(
  recipeId: string,
  yields: any[],
  machines: any[]
) {
  console.log(
    `DEBUG findBestMachineForRecipe: Finding best machine for recipe ${recipeId}`
  );
  console.log(
    `DEBUG findBestMachineForRecipe: Available machines: ${machines.length}`
  );
  console.log(
    `DEBUG findBestMachineForRecipe: Available yields: ${yields.length}`
  );

  // Get all yields for this recipe
  const recipeYields = yields.filter((y) => {
    try {
      return y.recipeId && y.recipeId.toString() === recipeId;
    } catch (error) {
      console.log(
        `DEBUG findBestMachineForRecipe: Error comparing yield recipe ID: ${error}`
      );
      return false;
    }
  });

  console.log(
    `DEBUG findBestMachineForRecipe: Found ${recipeYields.length} yields for this recipe`
  );

  // If no recipe yields OR if recipeId is null/undefined, use default approach
  if (recipeYields.length === 0 || !recipeId) {
    console.log(
      `DEBUG findBestMachineForRecipe: No specific yield data found, using defaults`
    );

    // No specific yield data found, use default values
    // Find machine with highest capacity
    if (machines.length === 0) {
      console.log(`DEBUG findBestMachineForRecipe: No machines available`);
      return null;
    }

    // Sort machines by capacity for best fit
    const sortedMachines = [...machines].sort(
      (a, b) => b.tubCapacity - a.tubCapacity
    );
    const bestMachine = sortedMachines[0];

    console.log(
      `DEBUG findBestMachineForRecipe: Selected machine ${bestMachine._id} with capacity ${bestMachine.tubCapacity}, using default of 3 tubs per batch`
    );

    // As per user request, use default of 3 tubs per batch if no yield data
    return {
      machineId: bestMachine._id.toString(),
      tubsPerBatch: 3, // Default if no yield data - user requested 3 as default
      productionTimeMinutes: bestMachine.productionTime || 60, // Default to 60 minutes if not specified
    };
  }

  // Find best match based on efficiency (highest tubsPerBatch)
  let bestMatch = null;
  let highestEfficiency = 0;

  console.log(
    `DEBUG findBestMachineForRecipe: Evaluating ${recipeYields.length} yield records`
  );

  for (const yieldItem of recipeYields) {
    console.log(
      `DEBUG findBestMachineForRecipe: Checking yield for machine ${yieldItem.machineId} with ${yieldItem.tubsPerBatch} tubs per batch`
    );

    const machine = machines.find(
      (m) => m._id.toString() === yieldItem.machineId.toString()
    );

    if (!machine) {
      console.log(
        `DEBUG findBestMachineForRecipe: Machine not found or not available`
      );
      continue;
    }

    console.log(
      `DEBUG findBestMachineForRecipe: Found matching machine ${machine.name} with capacity ${machine.tubCapacity}`
    );

    // More lenient check - as long as machine has some capacity, we can use it
    // Just cap the tubs per batch to the machine's capacity if needed
    const effectiveTubsPerBatch = Math.min(
      yieldItem.tubsPerBatch,
      machine.tubCapacity
    );
    const productionTime = machine.productionTime || 60; // Default to 60 minutes if not specified

    const efficiency = effectiveTubsPerBatch / productionTime;

    console.log(
      `DEBUG findBestMachineForRecipe: Calculated efficiency: ${efficiency} (${effectiveTubsPerBatch} tubs / ${productionTime} minutes)`
    );

    if (efficiency > highestEfficiency) {
      console.log(`DEBUG findBestMachineForRecipe: New best match found!`);
      highestEfficiency = efficiency;
      bestMatch = {
        machineId: machine._id.toString(),
        tubsPerBatch: effectiveTubsPerBatch,
        productionTimeMinutes: productionTime,
      };
    }
  }

  // If no match found from yields, use most efficient machine as fallback
  if (!bestMatch && machines.length > 0) {
    console.log(
      `DEBUG findBestMachineForRecipe: No yield match found, using fallback to best available machine`
    );

    // Calculate efficiency as capacity/time
    const machinesWithEfficiency = machines.map((machine) => ({
      machine,
      efficiency: machine.tubCapacity / (machine.productionTime || 60),
    }));

    // Sort by efficiency (highest first)
    machinesWithEfficiency.sort((a, b) => b.efficiency - a.efficiency);

    const bestMachine = machinesWithEfficiency[0].machine;

    console.log(
      `DEBUG findBestMachineForRecipe: Selected fallback machine ${bestMachine.name}`
    );

    bestMatch = {
      machineId: bestMachine._id.toString(),
      tubsPerBatch: Math.min(3, bestMachine.tubCapacity), // Use default 3 or machine capacity, whichever is smaller
      productionTimeMinutes: bestMachine.productionTime || 60,
    };
  }

  console.log(
    `DEBUG findBestMachineForRecipe: Final result: ${
      bestMatch ? "Match found" : "No match found"
    }`
  );

  return bestMatch;
}

// Find available time slots in the schedule
function findAvailableTimeSlots(
  weekStartDate: Date,
  workDays: number[],
  workdayStartMinutes: number,
  workdayEndMinutes: number,
  requiredMinutes: number,
  scheduledBlocks: ScheduledBlock[],
  machineId: string
) {
  console.log(
    `DEBUG findAvailableTimeSlots: Looking for slots of ${requiredMinutes} minutes for machine ${machineId}`
  );
  console.log(
    `DEBUG findAvailableTimeSlots: Week start date: ${weekStartDate}, work days: ${workDays}`
  );
  console.log(
    `DEBUG findAvailableTimeSlots: Workday: ${workdayStartMinutes}-${workdayEndMinutes} minutes`
  );
  console.log(
    `DEBUG findAvailableTimeSlots: Currently scheduled blocks: ${scheduledBlocks.length}`
  );

  const availableSlots = [];

  // Go through each workday in the week
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = addDays(new Date(weekStartDate), dayOffset);
    const dayOfWeek = getDay(currentDate);
    console.log(
      `DEBUG findAvailableTimeSlots: Checking day ${format(
        currentDate,
        "yyyy-MM-dd"
      )} (day of week: ${dayOfWeek})`
    );

    // Skip if not a work day
    if (!workDays.includes(dayOfWeek)) {
      console.log(`DEBUG findAvailableTimeSlots: Skipping - not a work day`);
      continue;
    }
    console.log(`DEBUG findAvailableTimeSlots: Valid work day found`);
    // Set the start and end times for this workday
    const dayStart = set(currentDate, {
      hours: Math.floor(workdayStartMinutes / 60),
      minutes: workdayStartMinutes % 60,
      seconds: 0,
      milliseconds: 0,
    });

    const dayEnd = set(currentDate, {
      hours: Math.floor(workdayEndMinutes / 60),
      minutes: workdayEndMinutes % 60,
      seconds: 0,
      milliseconds: 0,
    });

    // Get blocks scheduled for this day and machine
    const dayBlocks = scheduledBlocks.filter((block) => {
      return (
        block.machineId === machineId &&
        format(block.startTime, "yyyy-MM-dd") ===
          format(currentDate, "yyyy-MM-dd")
      );
    });

    // Sort blocks by start time
    dayBlocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Sort blocked times for easier calculation
    const blockedTimes = dayBlocks
      .map((block) => ({
        start: block.startTime,
        end: block.endTime,
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    console.log(
      `DEBUG findAvailableTimeSlots: Found ${blockedTimes.length} existing blocks for this day and machine`
    );
    blockedTimes.forEach((block, i) => {
      console.log(
        `DEBUG findAvailableTimeSlots: Block ${i + 1}: ${format(
          block.start,
          "HH:mm"
        )} to ${format(block.end, "HH:mm")}`
      );
    });

    console.log(
      `DEBUG findAvailableTimeSlots: Workday boundaries: ${format(
        dayStart,
        "HH:mm"
      )} to ${format(dayEnd, "HH:mm")}`
    );
    console.log(
      `DEBUG findAvailableTimeSlots: Need to find ${requiredMinutes} minutes of available time`
    );

    let availableStart = dayStart;

    // Check for gaps between blocks
    for (const block of blockedTimes) {
      const gapMinutes = differenceInMinutes(block.start, availableStart);
      console.log(
        `DEBUG findAvailableTimeSlots: Gap of ${gapMinutes} minutes found between ${format(
          availableStart,
          "HH:mm"
        )} and ${format(block.start, "HH:mm")}`
      );

      if (gapMinutes >= requiredMinutes) {
        const slot = {
          startTime: availableStart,
          endTime: addMinutes(availableStart, requiredMinutes),
          availableMinutes: gapMinutes,
        };
        console.log(
          `DEBUG findAvailableTimeSlots: FOUND SLOT! ${format(
            slot.startTime,
            "HH:mm"
          )} to ${format(slot.endTime, "HH:mm")}`
        );
        availableSlots.push(slot);
      } else {
        console.log(
          `DEBUG findAvailableTimeSlots: Gap too small (${gapMinutes} min), need ${requiredMinutes} min`
        );
      }

      // Move the available start time to after this block
      availableStart = block.end;
    }

    // Check for gap after the last block (or from the beginning if no blocks)
    const remainingMinutes = differenceInMinutes(dayEnd, availableStart);
    console.log(
      `DEBUG findAvailableTimeSlots: Final gap of ${remainingMinutes} minutes from ${format(
        availableStart,
        "HH:mm"
      )} to ${format(dayEnd, "HH:mm")}`
    );

    if (remainingMinutes >= requiredMinutes) {
      const slot = {
        startTime: availableStart,
        endTime: addMinutes(availableStart, requiredMinutes),
        availableMinutes: remainingMinutes,
      };
      console.log(
        `DEBUG findAvailableTimeSlots: FOUND FINAL SLOT! ${format(
          slot.startTime,
          "HH:mm"
        )} to ${format(slot.endTime, "HH:mm")}`
      );
      availableSlots.push(slot);
    } else {
      console.log(
        `DEBUG findAvailableTimeSlots: Final gap too small (${remainingMinutes} min), need ${requiredMinutes} min`
      );
    }
  }

  return availableSlots;
}

// Find an available employee for a time slot
function findAvailableEmployee(
  employees: any[],
  scheduledBlocks: ScheduledBlock[],
  startTime: Date,
  endTime: Date
) {
  // Try to find an employee who isn't scheduled during this time
  for (const employee of employees) {
    const isAvailable = !scheduledBlocks.some((block) => {
      return (
        block.employeeId === employee._id.toString() &&
        ((block.startTime <= startTime && block.endTime > startTime) ||
          (block.startTime < endTime && block.endTime >= endTime) ||
          (block.startTime >= startTime && block.endTime <= endTime))
      );
    });

    if (isAvailable) {
      return employee._id.toString();
    }
  }

  // If all employees are busy, just return the first one
  // In a real implementation, you might want a more sophisticated approach
  return employees[0]._id.toString();
}

export default router;
