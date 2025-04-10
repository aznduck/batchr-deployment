import mongoose from "mongoose";

const ProductionPlanSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  weekStartDate: { 
    type: Date, 
    required: true,
    index: true 
  },
  // Reference to production blocks that make up this plan
  blocks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ProductionBlock" 
  }],
  // Overall completion status
  completionStatus: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0,
    get: (v: number) => parseFloat(v.toFixed(1))
  },
  // Reference to recipes included in this plan
  recipes: [{ 
    recipeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Recipe" 
    },
    plannedAmount: { 
      type: Number, 
      min: 0,
      get: (v: number) => parseFloat(v.toFixed(2))
    },
    completedAmount: { 
      type: Number, 
      min: 0,
      default: 0,
      get: (v: number) => parseFloat(v.toFixed(2))
    }
  }],
  // Notes for the production plan
  notes: { 
    type: String 
  },
  // Status of the production plan
  status: {
    type: String,
    enum: ["draft", "active", "completed", "archived"],
    default: "draft"
  },
  // Version tracking
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  // Creator and creation time
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  // Last modifier and modification time
  lastModifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  lastModifiedAt: { 
    type: Date 
  },
  // Owner (shop/business)
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Add index for efficient querying by date range
ProductionPlanSchema.index({ weekStartDate: 1, owner: 1 });

export default mongoose.model("ProductionPlan", ProductionPlanSchema);
