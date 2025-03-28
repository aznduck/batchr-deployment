import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User";
import Ingredient from "./models/Ingredient";
import Recipe from "./models/Recipe";
import Supplier from "./models/Supplier";
import { ingredients, recipes, suppliers } from "./data/data";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    // Clear all collections
    await User.deleteMany({});
    await Ingredient.deleteMany({});
    await Recipe.deleteMany({});
    await Supplier.deleteMany({});

    // Create admin user
    const hashedPassword = await bcrypt.hash("123", 10);
    const adminUser = await User.create({
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
    });

    // Associate seed data with admin user
    const ingredientsWithOwner = ingredients.map((ingredient) => ({
      ...ingredient,
      owner: adminUser._id,
    }));

    const recipesWithOwner = recipes.map((recipe) => ({
      ...recipe,
      owner: adminUser._id,
    }));

    const suppliersWithOwner = suppliers.map((supplier) => ({
      ...supplier,
      owner: adminUser._id,
    }));

    // Insert data with owner references
    await Ingredient.insertMany(ingredientsWithOwner);
    await Recipe.insertMany(recipesWithOwner);
    await Supplier.insertMany(suppliersWithOwner);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit();
  }
};

seed();
