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
  batches: [
    {
      date: String,
      supervisor: String,
      quantity: { type: Number, min: 0, get: (v: number) => parseFloat(v.toFixed(3)) },
      notes: String,
    },
  ],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

export default mongoose.model("Recipe", RecipeSchema);
