import mongoose from "mongoose";

const IngredientSchema = new mongoose.Schema({
  id: String,
  name: String,
  stock: Number,
  unit: String,
  threshold: Number,
  history: [{ date: String, level: Number }],
});

export default mongoose.model("Ingredient", IngredientSchema);
