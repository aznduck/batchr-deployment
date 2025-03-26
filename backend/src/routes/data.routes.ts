import express, { Request, Response, NextFunction } from "express";
import Ingredient from "../models/Ingredient";
import Recipe from "../models/Recipe";
import Supplier from "../models/Supplier";
import User from "../models/User";
import { Document } from "mongoose";

const router = express.Router();

// Extend session to include user property
declare module "express-session" {
  interface SessionData {
    user?: { username: string };
  }
}

interface AuthedRequest extends Request {
  user?: Document & { _id: string; username: string };
}

// Auth middleware
const ensureAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });
  const userDoc = await User.findOne({ username: req.session.user.username });
  if (!userDoc) return res.status(404).json({ message: "User not found" });
  req.user = {
    ...(userDoc.toObject() as Record<string, unknown>),
    _id: userDoc._id.toString(),
  } as Document & { _id: string; username: string };
  next();
};

// INGREDIENT ROUTES
router.get("/ingredients", ensureAuth, async (req: AuthedRequest, res: Response) => {
  const data = await Ingredient.find({ owner: req.user!._id });
  res.json(data);
});

router.post("/ingredients", ensureAuth, async (req: AuthedRequest, res: Response) => {
  const newIngredient = new Ingredient({ ...req.body, owner: req.user!._id });
  await newIngredient.save();
  res.status(201).json(newIngredient);
});

router.delete("/ingredients/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  await Ingredient.findOneAndDelete({ _id: req.params.id, owner: req.user!._id });
  res.status(204).end();
});

// RECIPE ROUTES
router.get("/recipes", ensureAuth, async (req: AuthedRequest, res: Response) => {
  const data = await Recipe.find({ owner: req.user!._id });
  res.json(data);
});

router.post("/recipes", ensureAuth, async (req: AuthedRequest, res: Response) => {
  const newRecipe = new Recipe({ ...req.body, owner: req.user!._id });
  await newRecipe.save();
  res.status(201).json(newRecipe);
});

router.delete("/recipes/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  await Recipe.findOneAndDelete({ _id: req.params.id, owner: req.user!._id });
  res.status(204).end();
});

// SUPPLIER ROUTES
router.get("/suppliers", ensureAuth, async (req: AuthedRequest, res: Response) => {
  const data = await Supplier.find({ owner: req.user!._id });
  res.json(data);
});

router.post("/suppliers", ensureAuth, async (req: AuthedRequest, res: Response) => {
  const newSupplier = new Supplier({ ...req.body, owner: req.user!._id });
  await newSupplier.save();
  res.status(201).json(newSupplier);
});

router.delete("/suppliers/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  await Supplier.findOneAndDelete({ _id: req.params.id, owner: req.user!._id });
  res.status(204).end();
});

export default router;
