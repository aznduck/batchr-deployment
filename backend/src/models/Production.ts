import mongoose from "mongoose";

const ProductionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
  quantity: { type: Number, required: true },
  notes: String,
  supervisor: { type: String, required: true },
  owner: { type: String, required: true },
});

export const Production = mongoose.model("Production", ProductionSchema);
