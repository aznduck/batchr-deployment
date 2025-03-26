import mongoose from "mongoose";

const IngredientSchema = new mongoose.Schema({
  name: String,
  stock: Number,
  unit: String,
  threshold: Number,
  history: [{ date: String, level: Number }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("Ingredient", IngredientSchema);
