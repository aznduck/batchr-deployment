import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema({
  id: String,
  name: String,
  ingredients: [
    {
      ingredientId: String,
      amount: Number,
    },
  ],
  batches: [
    {
      date: String,
      supervisor: String,
      quantity: Number,
      notes: String,
    },
  ],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("Recipe", RecipeSchema);
