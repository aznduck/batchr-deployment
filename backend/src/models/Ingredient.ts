import mongoose from "mongoose";

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { 
    type: Number, 
    required: true, 
    min: 0, 
    get: (v: number | undefined) => v !== undefined ? parseFloat(v.toFixed(3)) : undefined 
  },
  unit: { type: String, required: true },
  threshold: { 
    type: Number, 
    required: true, 
    min: 0, 
    get: (v: number | undefined) => v !== undefined ? parseFloat(v.toFixed(3)) : undefined 
  },
  history: [{
    date: String,
    level: { 
      type: Number, 
      get: (v: number | undefined) => v !== undefined ? parseFloat(v.toFixed(3)) : undefined 
    }
  }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  minimumOrderQuantity: { 
    type: Number, 
    min: 0, 
    get: (v: number | undefined) => v !== undefined ? parseFloat(v.toFixed(3)) : undefined 
  },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  upc: { type: String },
  unitCategory: { type: String },
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

export default mongoose.model("Ingredient", IngredientSchema);
