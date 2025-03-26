import Ingredient from "../models/Ingredient";
import Recipe from "../models/Recipe";
import Supplier from "../models/Supplier";
import { ingredients, recipes, suppliers } from "../data/data";

export const seedAdminData = async (ownerId: string) => {
  await Ingredient.insertMany(
    ingredients.map((i) => ({ ...i, owner: ownerId }))
  );
  await Recipe.insertMany(
    recipes.map((r) => ({ ...r, owner: ownerId }))
  );
  await Supplier.insertMany(
    suppliers.map((s) => ({ ...s, owner: ownerId }))
  );
};