import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema({
  id: String,
  name: { type: String, required: true },
  ingredients: [
    {
      ingredientId: { type: String, required: true },
      amount: { type: Number, required: true, min: 0, get: (v: number) => parseFloat(v.toFixed(3)) },
    },
  ],
  // Current tub inventory
  currentInventory: { 
    type: Number, 
    default: 0, 
    min: 0,
    get: (v: number) => parseFloat(v.toFixed(2)) 
  },
  // Weekly production goal in tubs
  weeklyProductionGoal: { 
    type: Number, 
    default: 0, 
    min: 0,
    get: (v: number) => parseFloat(v.toFixed(2)) 
  },
  // Planned production amount in tubs
  plannedProduction: { 
    type: Number, 
    default: 0, 
    min: 0,
    get: (v: number) => parseFloat(v.toFixed(2)) 
  },
  // Goal achievement percentage
  goalAchievement: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100,
    get: (v: number) => parseFloat(v.toFixed(1)) 
  },
  batches: [
    {
      batchNumber: { type: String, required: true },
      date: { type: String, required: true },
      supervisor: { type: String, required: true },
      quantity: { type: Number, min: 0, get: (v: number) => parseFloat(v.toFixed(3)) },
      notes: String,
      machineId: { type: mongoose.Schema.Types.ObjectId, ref: "Machine" },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["planned", "in-progress", "completed"],
        default: "planned"
      }
    },
  ],
  // Version control and audit fields
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  // Track modification history
  versionHistory: [
    {
      modifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true 
      },
      modifiedAt: { 
        type: Date, 
        default: Date.now 
      },
      changes: { 
        type: Object 
      },
      notes: String
    }
  ],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

export default mongoose.model("Recipe", RecipeSchema);
