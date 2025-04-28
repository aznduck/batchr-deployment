import mongoose from "mongoose";

// Schema for tracking machine-specific recipe yields
const recipeMachineYieldSchema = new mongoose.Schema(
  {
    // References to related models
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    
    // Yield data
    tubsPerBatch: {
      type: Number,
      required: true,
      min: 0.1, // Allow fractional tubs if needed
      default: 1,
    },
    
    // Optional notes about this specific recipe-machine combination
    notes: {
      type: String,
      required: false,
    },
    
    // Standard audit fields
    createdBy: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Standard schema options
    timestamps: true,
    versionKey: false,
  }
);

// Add compound index to ensure recipe-machine combinations are unique
recipeMachineYieldSchema.index({ recipeId: 1, machineId: 1 }, { unique: true });

// Interface for calculating production time results
interface ProductionTimeCalculation {
  batchesNeeded: number;
  totalMinutes: number;
  tubsPerBatch: number;
  machineProductionTime: number;
}

// Add custom static method for calculation
interface RecipeMachineYieldModel extends mongoose.Model<any> {
  calculateProductionTime(
    machineId: string,
    recipeId: string, 
    desiredQuantity: number
  ): Promise<ProductionTimeCalculation>;
}

// Create a method to calculate production time based on machine and quantity
recipeMachineYieldSchema.static('calculateProductionTime', async function(
  machineId: string,
  recipeId: string,
  desiredQuantity: number
): Promise<ProductionTimeCalculation> {
  // First, find the yield data for this machine-recipe combination
  const yieldData = await this.findOne({ machineId, recipeId });
  
  if (!yieldData) {
    throw new Error("No yield data found for this machine-recipe combination");
  }
  
  // Then, find the machine to get its production time per batch
  const Machine = mongoose.model("Machine");
  const machine = await Machine.findById(machineId);
  
  if (!machine) {
    throw new Error("Machine not found");
  }
  
  // Calculate how many batches are needed
  const batchesNeeded = desiredQuantity / yieldData.tubsPerBatch;
  
  // Calculate total production time in minutes
  const totalMinutes = batchesNeeded * machine.productionTime;
  
  return {
    batchesNeeded: Math.ceil(batchesNeeded), // Round up to whole batches
    totalMinutes: Math.ceil(totalMinutes),   // Round up to whole minutes
    tubsPerBatch: yieldData.tubsPerBatch,
    machineProductionTime: machine.productionTime,
  };
});

// Auto-update the updatedAt field on save
recipeMachineYieldSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the model
const RecipeMachineYield = mongoose.model<any, RecipeMachineYieldModel>(
  "RecipeMachineYield",
  recipeMachineYieldSchema
);

export default RecipeMachineYield;
