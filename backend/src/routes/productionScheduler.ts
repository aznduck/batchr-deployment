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
} from "date-fns";

const router = express.Router();

// Define types
interface ScheduleGenerationOptions {
  planId: string;
  weekStartDate: Date;
  recipes: {
    recipeId: string;
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

    // Validate plan exists
    const plan = await ProductionPlan.findOne({
      _id: options.planId,
      owner: req.session.user?.id,
    });

    if (!plan) {
      return res.status(404).json({ message: "Production plan not found" });
    }

    // Get available machines
    const machines = await Machine.find({
      owner: req.session.user?.id,
      status: "available", // Only use available machines
    });

    if (machines.length === 0) {
      return res.status(400).json({
        message: "No available machines found for scheduling",
      });
    }

    // Get available employees
    const employees = await Employee.find({
      owner: req.session.user?.id,
      active: true, // Only use active employees
    });

    if (employees.length === 0) {
      return res.status(400).json({
        message: "No active employees found for scheduling",
      });
    }

    // Load all recipe-machine yields for the requested recipes
    const recipeIds = options.recipes.map((r) => r.recipeId);
    const machineIds = machines.map((m) => m._id.toString());

    const recipeYields = await RecipeMachineYield.find({
      recipeId: { $in: recipeIds },
      machineId: { $in: machineIds },
    });

    // Load recipe details
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      owner: req.session.user?.id,
    });

    // Mapping for easier access
    const recipeMap = new Map(recipes.map((r) => [r._id.toString(), r]));
    const machineMap = new Map(machines.map((m) => [m._id.toString(), m]));
    const employeeMap = new Map(employees.map((e) => [e._id.toString(), e]));

    // Schedule blocks
    const scheduledBlocks: ScheduledBlock[] = [];
    const unscheduledRecipes: {
      recipeId: string;
      remainingAmount: number;
      recipeName?: string;
    }[] = [];

    // Workday information
    const workdayStart = parseTimeString(options.workdayStartTime);
    const workdayEnd = parseTimeString(options.workdayEndTime);
    if (!workdayStart || !workdayEnd) {
      return res.status(400).json({ message: "Invalid workday time format" });
    }

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

    // Loop through each recipe and schedule production blocks
    for (const recipeRequest of options.recipes) {
      const { recipeId, plannedAmount } = recipeRequest;

      // Get recipe details
      const recipe = recipeMap.get(recipeId);
      if (!recipe) {
        unscheduledRecipes.push({
          recipeId,
          remainingAmount: plannedAmount,
          recipeName: "Unknown Recipe",
        });
        continue;
      }

      // Find the best machine for this recipe
      const bestMatch = findBestMachineForRecipe(
        recipeId,
        recipeYields,
        machines
      );

      if (!bestMatch) {
        unscheduledRecipes.push({
          recipeId,
          remainingAmount: plannedAmount,
          recipeName: recipe.name,
        });
        continue;
      }

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
          recipeId,
          remainingAmount: plannedAmount,
          recipeName: recipe.name,
        });
        continue;
      }

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
        recipeId,
        quantity: plannedAmount,
        planId: options.planId,
      });

      currentTime = productionEndTime;

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
    }

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

    // Update the production plan with the blocks
    await plan.save();

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
  // Get all yields for this recipe
  const recipeYields = yields.filter((y) => y.recipeId.toString() === recipeId);

  if (recipeYields.length === 0) {
    // No specific yield data found, use default values
    // Find machine with highest capacity
    if (machines.length === 0) return null;
    
    // Sort machines by capacity for best fit
    const sortedMachines = [...machines].sort((a, b) => b.tubCapacity - a.tubCapacity);
    const bestMachine = sortedMachines[0];
    
    console.log(`No yield data found for recipe ${recipeId}, using default of 3 tubs per batch`);
    
    // As per user request, use default of 3 tubs per batch if no yield data
    return {
      machineId: bestMachine._id.toString(),
      tubsPerBatch: 3, // Default if no yield data - user requested 3 as default
      productionTimeMinutes: bestMachine.productionTime
    };
  }

  // Find best match based on efficiency (highest tubsPerBatch)
  let bestMatch = null;
  let highestEfficiency = 0;

  for (const yieldItem of recipeYields) {
    const machine = machines.find(
      (m) => m._id.toString() === yieldItem.machineId.toString()
    );

    if (!machine) continue;

    // Check if machine has enough capacity for this recipe's yield
    if (machine.tubCapacity < yieldItem.tubsPerBatch) continue;

    const efficiency = yieldItem.tubsPerBatch / machine.productionTime;

    if (efficiency > highestEfficiency) {
      highestEfficiency = efficiency;
      bestMatch = {
        machineId: machine._id.toString(),
        tubsPerBatch: yieldItem.tubsPerBatch,
        productionTimeMinutes: machine.productionTime,
      };
    }
  }

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
  const availableSlots = [];

  // Go through each workday in the week
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = addDays(new Date(weekStartDate), dayOffset);
    const dayOfWeek = getDay(currentDate);

    // Skip if not a work day
    if (!workDays.includes(dayOfWeek)) continue;

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

    // Find gaps between blocks
    let currentTime = dayStart;

    // Check if there's space before the first block
    if (dayBlocks.length === 0) {
      // No blocks yet, the whole day is available
      const availableMinutes =
        (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60);

      if (availableMinutes >= requiredMinutes) {
        availableSlots.push({
          startTime: currentTime,
          endTime: addMinutes(currentTime, requiredMinutes),
          availableMinutes,
        });
      }
    } else {
      // Check gap before first block
      if (dayBlocks[0].startTime > currentTime) {
        const availableMinutes =
          (dayBlocks[0].startTime.getTime() - currentTime.getTime()) /
          (1000 * 60);

        if (availableMinutes >= requiredMinutes) {
          availableSlots.push({
            startTime: currentTime,
            endTime: addMinutes(currentTime, requiredMinutes),
            availableMinutes,
          });
        }
      }

      // Check gaps between blocks
      for (let i = 0; i < dayBlocks.length - 1; i++) {
        const gapStart = dayBlocks[i].endTime;
        const gapEnd = dayBlocks[i + 1].startTime;
        const availableMinutes =
          (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60);

        if (availableMinutes >= requiredMinutes) {
          availableSlots.push({
            startTime: gapStart,
            endTime: addMinutes(gapStart, requiredMinutes),
            availableMinutes,
          });
        }
      }

      // Check gap after last block
      const lastBlock = dayBlocks[dayBlocks.length - 1];
      if (lastBlock.endTime < dayEnd) {
        const availableMinutes =
          (dayEnd.getTime() - lastBlock.endTime.getTime()) / (1000 * 60);

        if (availableMinutes >= requiredMinutes) {
          availableSlots.push({
            startTime: lastBlock.endTime,
            endTime: addMinutes(lastBlock.endTime, requiredMinutes),
            availableMinutes,
          });
        }
      }
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
