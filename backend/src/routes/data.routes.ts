import express, { Request, Response, NextFunction } from "express";
import Ingredient from "../models/Ingredient";
import Recipe from "../models/Recipe";
import Supplier from "../models/Supplier";
import User from "../models/User";
import { Document, Types } from "mongoose";

const router = express.Router();

interface AuthedRequest extends Request {
  user?: Document & { _id: Types.ObjectId; username: string };
}

// Auth middleware
const ensureAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    console.log("Auth check - Session:", req.session);
    
    if (!req.session.user) {
      console.log("No session user found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userDoc = await User.findOne({ username: req.session.user.username });
    if (!userDoc) {
      console.log("User not found:", req.session.user.username);
      return res.status(404).json({ message: "User not found" });
    }

    req.user = userDoc;
    console.log("User authenticated:", userDoc.username);
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Authentication error" });
  }
};

// INGREDIENT ROUTES
router.get("/ingredients", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const data = await Ingredient.find({ owner: req.user!._id });
    res.json(data);
  } catch (err) {
    console.error("Error fetching ingredients:", err);
    res.status(500).json({ message: "Error fetching ingredients" });
  }
});

router.post("/ingredients", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const newIngredient = new Ingredient({ ...req.body, owner: req.user!._id });
    await newIngredient.save();
    res.status(201).json(newIngredient);
  } catch (err) {
    console.error("Error creating ingredient:", err);
    res.status(500).json({ message: "Error creating ingredient" });
  }
});

router.put("/ingredients/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      { ...req.body },
      { new: true }
    );
    
    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found" });
    }
    
    res.json(ingredient);
  } catch (err) {
    console.error("Error updating ingredient:", err);
    res.status(500).json({ message: "Error updating ingredient" });
  }
});

router.delete("/ingredients/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    await Ingredient.findOneAndDelete({ _id: req.params.id, owner: req.user!._id });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting ingredient:", err);
    res.status(500).json({ message: "Error deleting ingredient" });
  }
});

// RECIPE ROUTES
router.get("/recipes", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const data = await Recipe.find({ owner: req.user!._id });
    res.json(data);
  } catch (err) {
    console.error("Error fetching recipes:", err);
    res.status(500).json({ message: "Error fetching recipes" });
  }
});

router.post("/recipes", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const newRecipe = new Recipe({
      ...req.body,
      owner: req.user!._id,
      batches: [] // Initialize with empty batches array
    });
    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (err) {
    console.error("Error creating recipe:", err);
    res.status(500).json({ message: "Error creating recipe" });
  }
});

router.put("/recipes/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      { ...req.body },
      { new: true }
    );
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    res.json(recipe);
  } catch (err) {
    console.error("Error updating recipe:", err);
    res.status(500).json({ message: "Error updating recipe" });
  }
});

router.delete("/recipes/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    await Recipe.findOneAndDelete({ _id: req.params.id, owner: req.user!._id });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting recipe:", err);
    res.status(500).json({ message: "Error deleting recipe" });
  }
});

// SUPPLIER ROUTES
router.get("/suppliers", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const data = await Supplier.find({ owner: req.user!._id });
    res.json(data);
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    res.status(500).json({ message: "Error fetching suppliers" });
  }
});

router.post("/suppliers", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const newSupplier = new Supplier({ ...req.body, owner: req.user!._id });
    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (err) {
    console.error("Error creating supplier:", err);
    res.status(500).json({ message: "Error creating supplier" });
  }
});

router.delete("/suppliers/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    await Supplier.findOneAndDelete({ _id: req.params.id, owner: req.user!._id });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting supplier:", err);
    res.status(500).json({ message: "Error deleting supplier" });
  }
});

export default router;
