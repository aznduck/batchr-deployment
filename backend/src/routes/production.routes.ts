import express from "express";
import { authenticateUser } from "../middleware/auth";
import Recipe from "../models/Recipe";
import Ingredient from "../models/Ingredient";
import { Production } from "../models/Production";

const router = express.Router();

// Get all production logs for the authenticated user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const logs = await Production.find({ owner: req.session.user?.username })
      .sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Failed to fetch production logs:", err);
    res.status(500).json({ error: "Failed to fetch production logs" });
  }
});

// Add a new production log and update ingredient stocks
router.post("/", authenticateUser, async (req, res) => {
  const { date, recipeId, quantity, notes, supervisor } = req.body;

  try {
    // Find the recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Check if we have enough ingredients
    const ingredientUpdates = [];
    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = await Ingredient.findById(recipeIngredient.ingredientId);
      if (!ingredient) {
        return res.status(404).json({ 
          error: `Ingredient not found: ${recipeIngredient.ingredientId}` 
        });
      }

      // Ensure amount and stock are defined
      const amount = recipeIngredient.amount ?? 0;
      const currentStock = ingredient.stock ?? 0;

      // Calculate how much of this ingredient we need
      const requiredAmount = amount * quantity;
      
      // Check if we have enough
      if (currentStock < requiredAmount) {
        return res.status(400).json({
          error: `Insufficient stock for ingredient: ${ingredient.name}. Need ${requiredAmount} ${ingredient.unit}, but only have ${currentStock} ${ingredient.unit}`,
        });
      }

      // Queue the update
      ingredientUpdates.push({
        ingredientId: ingredient._id,
        newStock: currentStock - requiredAmount,
      });
    }

    // Get current date in YYYY-MM-DD format for history
    const today = new Date().toISOString().split('T')[0];

    // Create production log
    const production = new Production({
      date: new Date(date), // Store full date for production log
      recipeId,
      quantity,
      notes,
      supervisor,
      owner: req.session.user?.username,
    });

    // Save production log
    await production.save();

    // Update all ingredient stocks
    for (const update of ingredientUpdates) {
      await Ingredient.findByIdAndUpdate(update.ingredientId, {
        $set: { stock: update.newStock },
        $push: {
          history: {
            date: today, // Use today's date for stock history
            level: update.newStock,
          },
        },
      });
    }

    res.status(201).json(production);
  } catch (err) {
    console.error("Failed to add production log:", err);
    res.status(500).json({ error: "Failed to add production log" });
  }
});

export default router;
