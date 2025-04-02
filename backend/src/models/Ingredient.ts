import mongoose from "mongoose";

const IngredientSchema = new mongoose.Schema({
  name: String,
  stock: Number,
  unit: String,
  threshold: Number,
  history: [{ date: String, level: Number }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  minimumOrderQuantity: { type: Number, required: false },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: false },
  upc: { type: String, required: false },
  unitCategory: { type: String, required: false },
});

export default mongoose.model("Ingredient", IngredientSchema);
