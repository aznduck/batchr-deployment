import Machine from "../models/Machine";
import ProductionBlock from "../models/ProductionBlock";
import { Types } from "mongoose";

/**
 * Calculate production time based on machine capacity and recipe requirements
 * @param machineId Machine ID to use for production
 * @param recipeId Recipe ID to produce
 * @param quantity Quantity to produce in tubs
 * @returns Object containing recommended block duration and prep/cleaning times
 */
export const calculateProductionTime = async (
  machineId: string,
  quantity: number
): Promise<{
  productionMinutes: number;
  recommendedPrepMinutes: number;
  recommendedCleaningMinutes: number;
  totalMinutes: number;
}> => {
  // Get machine details for time calculation
  const machine = await Machine.findById(machineId);

  if (!machine) {
    throw new Error("Machine not found");
  }

  // Calculate production time based on machine capacity and quantity
  // Formula: (quantity / tubCapacity) * productionTime per batch
  const batches = Math.ceil(quantity / machine.tubCapacity);
  const productionMinutes = batches * machine.productionTime;

  // Calculate recommended prep and cleaning times based on machine and quantity
  // Larger production runs or larger machines need more prep time
  const recommendedPrepMinutes = Math.max(
    15,
    Math.round(machine.tubCapacity * 2.5)
  );

  // Cleaning time also scales with machine size
  const recommendedCleaningMinutes = Math.max(
    20,
    Math.round(machine.tubCapacity * 3)
  );

  return {
    productionMinutes,
    recommendedPrepMinutes,
    recommendedCleaningMinutes,
    totalMinutes:
      productionMinutes + recommendedPrepMinutes + recommendedCleaningMinutes,
  };
};

/**
 * Calculate end time based on start time and required minutes
 * @param startTime Start time of the block
 * @param minutes Duration in minutes
 * @returns End time
 */
export const calculateEndTime = (startTime: Date, minutes: number): Date => {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + minutes);
  return endTime;
};

/**
 * Check if a time slot is available for the given machine and employee
 * @param machineId Machine ID to check
 * @param employeeId Employee ID to check
 * @param startTime Proposed start time
 * @param endTime Proposed end time
 * @param ownerId Owner ID
 * @param excludeBlockId Optional block ID to exclude from check (for updates)
 * @returns Boolean indicating if the time slot is available
 */
export const isTimeSlotAvailable = async (
  machineId: string,
  employeeId: string,
  startTime: Date,
  endTime: Date,
  ownerId: string,
  excludeBlockId?: string
): Promise<boolean> => {
  // Query for blocks that would conflict with this time range
  const query: any = {
    owner: ownerId,
    status: { $nin: ["completed", "cancelled"] },
    $or: [
      // Overlapping time ranges
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };

  // Exclude the current block if we're updating
  if (excludeBlockId) {
    query._id = { $ne: excludeBlockId };
  }

  // Check machine conflicts
  const machineConflicts = await ProductionBlock.countDocuments({
    ...query,
    machineId,
  });

  // Check employee conflicts
  const employeeConflicts = await ProductionBlock.countDocuments({
    ...query,
    employeeId,
  });

  // Return true if no conflicts
  return machineConflicts === 0 && employeeConflicts === 0;
};

/**
 * Generate a suggested production schedule
 * @param machineId Machine ID to use
 * @param employeeId Employee ID to assign
 * @param recipeId Recipe ID to produce
 * @param quantity Quantity to produce
 * @param preferredStartTime Preferred start time
 * @param ownerId Owner ID
 * @returns Object containing suggested block times
 */
export const suggestProductionSchedule = async (
  machineId: string,
  employeeId: string,
  quantity: number,
  preferredStartTime: Date,
  ownerId: string
): Promise<{
  success: boolean;
  prepBlock?: { startTime: Date; endTime: Date };
  productionBlock?: { startTime: Date; endTime: Date };
  cleaningBlock?: { startTime: Date; endTime: Date };
  message?: string;
}> => {
  try {
    // Calculate required times
    const timeCalculation = await calculateProductionTime(machineId, quantity);

    // Generate a suggested schedule based on preferred start time
    const prepStartTime = new Date(preferredStartTime);
    const prepEndTime = calculateEndTime(
      prepStartTime,
      timeCalculation.recommendedPrepMinutes
    );

    const productionStartTime = new Date(prepEndTime);
    const productionEndTime = calculateEndTime(
      productionStartTime,
      timeCalculation.productionMinutes
    );

    const cleaningStartTime = new Date(productionEndTime);
    const cleaningEndTime = calculateEndTime(
      cleaningStartTime,
      timeCalculation.recommendedCleaningMinutes
    );

    // Check for conflicts
    const prepAvailable = await isTimeSlotAvailable(
      machineId,
      employeeId,
      prepStartTime,
      prepEndTime,
      ownerId
    );

    const productionAvailable = await isTimeSlotAvailable(
      machineId,
      employeeId,
      productionStartTime,
      productionEndTime,
      ownerId
    );

    const cleaningAvailable = await isTimeSlotAvailable(
      machineId,
      employeeId,
      cleaningStartTime,
      cleaningEndTime,
      ownerId
    );

    if (!prepAvailable || !productionAvailable || !cleaningAvailable) {
      return {
        success: false,
        message:
          "The suggested schedule has conflicts. Try a different start time.",
      };
    }

    return {
      success: true,
      prepBlock: {
        startTime: prepStartTime,
        endTime: prepEndTime,
      },
      productionBlock: {
        startTime: productionStartTime,
        endTime: productionEndTime,
      },
      cleaningBlock: {
        startTime: cleaningStartTime,
        endTime: cleaningEndTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error generating schedule: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};
