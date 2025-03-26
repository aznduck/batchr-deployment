import mongoose from "mongoose";
import dotenv from "dotenv";
import Ingredient from "./models/Ingredient";
import Recipe from "./models/Recipe";
import Supplier from "./models/Supplier";
import { ingredients, recipes, suppliers } from "./data/data";

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI!);
  await Ingredient.deleteMany({});
  await Recipe.deleteMany({});
  await Supplier.deleteMany({});
  await Ingredient.insertMany(ingredients);
  await Recipe.insertMany(recipes);
  await Supplier.insertMany(suppliers);
  console.log("Seeded successfully!");
  process.exit();
};

seed();
