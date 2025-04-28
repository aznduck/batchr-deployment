import express, { Request, Response, NextFunction } from "express";
import Recipe from "../models/Recipe";
import User from "../models/User";
import { Document, Types } from "mongoose";
import { Session } from "express-session";

const router = express.Router();

// Extend the session interface to include our user data
declare module "express-session" {
  interface Session {
    user?: {
      id: string;
      username: string;
      lastAccess: number;
    };
  }
}

interface AuthedRequest extends Request {
  user?: Document & { _id: Types.ObjectId; username: string };
  session: Session;
}

// Auth middleware
const ensureAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Update last access time
    req.session.user.lastAccess = Date.now();

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Authentication error" });
  }
};

// RECIPE BASIC ROUTES

// Get all recipes
router.get("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const recipes = await Recipe.find({ owner: req.session.user!.id });
    res.json(recipes);
  } catch (err) {
    console.error("Error fetching recipes:", err);
    res.status(500).json({ message: "Error fetching recipes" });
  }
});

// Get recipe by ID
router.get("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    res.json(recipe);
  } catch (err) {
    console.error("Error fetching recipe:", err);
    res.status(500).json({ message: "Error fetching recipe" });
  }
});

// Create new recipe
router.post("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the current user to set as creator
    const user = await User.findById(req.session.user!.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const newRecipe = new Recipe({
      ...req.body,
      owner: req.session.user!.id,
      createdBy: req.session.user!.id,
      createdAt: new Date(),
      batches: req.body.batches || [],
      versionHistory: []
    });
    
    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (err) {
    console.error("Error creating recipe:", err);
    res.status(500).json({ message: "Error creating recipe" });
  }
});

// Update recipe with version control
router.put("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the recipe to update
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    // Create a version history entry
    const changes: Record<string, { previous: any; new: any }> = {};
    const fieldsToTrack = ['name', 'ingredients', 'currentInventory', 'weeklyProductionGoal', 'plannedProduction'];
    
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined) {
        let previousValue;
        let newValue = req.body[field];
        
        // Access fields in a type-safe way
        switch(field) {
          case 'name':
            previousValue = recipe.name;
            break;
          case 'ingredients':
            previousValue = recipe.ingredients;
            break;
          case 'currentInventory':
            previousValue = recipe.currentInventory;
            break;
          case 'weeklyProductionGoal':
            previousValue = recipe.weeklyProductionGoal;
            break;
          case 'plannedProduction':
            previousValue = recipe.plannedProduction;
            break;
        }
        
        // Only add to changes if the values are different
        if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
          changes[field] = {
            previous: previousValue,
            new: newValue
          };
        }
      }
    });
    
    // If there are changes, add to version history
    if (Object.keys(changes).length > 0) {
      const historyEntry = {
        modifiedBy: req.session.user!.id,
        modifiedAt: new Date(),
        changes: changes,
        notes: req.body.versionNotes || 'Recipe updated'
      };
      
      // Update the recipe with new data and add to version history
      const updatedRecipe = await Recipe.findOneAndUpdate(
        { _id: req.params.id, owner: req.session.user!.id },
        { 
          ...req.body, 
          $push: { versionHistory: historyEntry },
          lastModifiedBy: req.session.user!.id,
          lastModifiedAt: new Date()
        },
        { new: true }
      );
      
      res.json(updatedRecipe);
    } else {
      // No changes detected
      res.json(recipe);
    }
  } catch (err) {
    console.error("Error updating recipe:", err);
    res.status(500).json({ message: "Error updating recipe" });
  }
});

// Delete recipe
router.delete("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    await Recipe.findOneAndDelete({ 
      _id: req.params.id, 
      owner: req.session.user!.id 
    });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting recipe:", err);
    res.status(500).json({ message: "Error deleting recipe" });
  }
});

// INVENTORY TRACKING ENDPOINTS

// Update recipe inventory
router.put("/:id/inventory", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { currentInventory } = req.body;
    
    // Validate input
    if (currentInventory === undefined || isNaN(currentInventory) || currentInventory < 0) {
      return res.status(400).json({ message: "Invalid inventory value" });
    }
    
    // Update the recipe inventory
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      { 
        currentInventory,
        lastModifiedBy: req.session.user!.id,
        lastModifiedAt: new Date(),
        $push: { 
          versionHistory: {
            modifiedBy: req.session.user!.id,
            modifiedAt: new Date(),
            changes: { currentInventory: { previous: null, new: currentInventory } },
            notes: 'Inventory updated'
          }
        }
      },
      { new: true }
    );
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    res.json(recipe);
  } catch (err) {
    console.error("Error updating recipe inventory:", err);
    res.status(500).json({ message: "Error updating recipe inventory" });
  }
});

// PRODUCTION GOAL MANAGEMENT ENDPOINTS

// Update recipe production goals
router.put("/:id/goals", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { weeklyProductionGoal, plannedProduction } = req.body;
    
    // Validate input
    if ((weeklyProductionGoal !== undefined && (isNaN(weeklyProductionGoal) || weeklyProductionGoal < 0)) || 
        (plannedProduction !== undefined && (isNaN(plannedProduction) || plannedProduction < 0))) {
      return res.status(400).json({ message: "Invalid production goal values" });
    }
    
    // Get the current recipe for history
    const currentRecipe = await Recipe.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!currentRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    // Prepare update object
    const updateObj: any = {
      lastModifiedBy: req.session.user!.id,
      lastModifiedAt: new Date()
    };
    
    // Add changes to version history
    const changes: Record<string, { previous: any; new: any }> = {};
    
    if (weeklyProductionGoal !== undefined) {
      updateObj.weeklyProductionGoal = weeklyProductionGoal;
      changes.weeklyProductionGoal = {
        previous: currentRecipe.weeklyProductionGoal,
        new: weeklyProductionGoal
      };
    }
    
    if (plannedProduction !== undefined) {
      updateObj.plannedProduction = plannedProduction;
      changes.plannedProduction = {
        previous: currentRecipe.plannedProduction,
        new: plannedProduction
      };
    }
    
    // Update recipe with production goals
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      { 
        ...updateObj,
        $push: { 
          versionHistory: {
            modifiedBy: req.session.user!.id,
            modifiedAt: new Date(),
            changes,
            notes: 'Production goals updated'
          }
        }
      },
      { new: true }
    );
    
    res.json(recipe);
  } catch (err) {
    console.error("Error updating recipe production goal:", err);
    res.status(500).json({ message: "Error updating recipe production goal" });
  }
});

// ACHIEVEMENT STATUS CALCULATIONS

// Calculate goal achievement status
router.put("/:id/calculate-achievement", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the recipe
    const recipe = await Recipe.findOne({ 
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    // Calculate achievement percentage
    let goalAchievement = 0;
    if (recipe.weeklyProductionGoal > 0) {
      // Calculate from current inventory and planned production
      const totalProduction = recipe.currentInventory + recipe.plannedProduction;
      goalAchievement = Math.min(100, (totalProduction / recipe.weeklyProductionGoal) * 100);
    }
    
    // Update the recipe with the calculated achievement
    const updatedRecipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      { 
        goalAchievement,
        lastModifiedBy: req.session.user!.id,
        lastModifiedAt: new Date()
      },
      { new: true }
    );
    
    res.json(updatedRecipe);
  } catch (err) {
    console.error("Error calculating goal achievement:", err);
    res.status(500).json({ message: "Error calculating goal achievement" });
  }
});

// BATCH MANAGEMENT ENDPOINTS

// Add a batch to recipe
router.post("/:id/batches", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { batchNumber, date, supervisor, quantity, machineId, notes, status } = req.body;
    
    // Validate required fields
    if (!batchNumber || !date || !supervisor || quantity === undefined) {
      return res.status(400).json({ message: "Missing required batch information" });
    }
    
    // Validate quantity
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }
    
    // Create batch object
    const batch = {
      batchNumber,
      date,
      supervisor,
      quantity,
      notes: notes || "",
      machineId: machineId || null,
      createdBy: req.session.user!.id,
      status: status || "planned"
    };
    
    // Add batch to recipe
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      { 
        $push: { batches: batch },
        lastModifiedBy: req.session.user!.id,
        lastModifiedAt: new Date()
      },
      { new: true }
    );
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    // If batch is completed, update current inventory
    if (status === "completed") {
      await Recipe.findOneAndUpdate(
        { _id: req.params.id, owner: req.session.user!.id },
        { 
          $inc: { currentInventory: quantity },
          lastModifiedBy: req.session.user!.id,
          lastModifiedAt: new Date()
        }
      );
    }
    
    // If batch is planned or in-progress, update planned production
    if (status === "planned" || status === "in-progress") {
      await Recipe.findOneAndUpdate(
        { _id: req.params.id, owner: req.session.user!.id },
        { 
          $inc: { plannedProduction: quantity },
          lastModifiedBy: req.session.user!.id,
          lastModifiedAt: new Date()
        }
      );
    }
    
    res.status(201).json(recipe);
  } catch (err) {
    console.error("Error adding batch:", err);
    res.status(500).json({ message: "Error adding batch" });
  }
});

// Update batch status
router.put("/:id/batches/:batchId", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { status, quantity } = req.body;
    const recipeId = req.params.id;
    const batchId = req.params.batchId;
    
    // Find the recipe
    const recipe = await Recipe.findOne({ 
      _id: recipeId,
      owner: req.session.user!.id
    });
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    // Find the batch
    const batchIndex = recipe.batches.findIndex((batch: any) => batch._id.toString() === batchId);
    
    if (batchIndex === -1) {
      return res.status(404).json({ message: "Batch not found" });
    }
    
    const currentBatch = recipe.batches[batchIndex];
    const oldStatus = currentBatch.status;
    const oldQuantity = currentBatch.quantity;
    
    // Create update path for the batch
    const updatePath = `batches.${batchIndex}.status`;
    const updateData: any = {
      [updatePath]: status,
      lastModifiedBy: req.session.user!.id,
      lastModifiedAt: new Date()
    };
    
    // If quantity is provided, update it
    if (quantity !== undefined) {
      updateData[`batches.${batchIndex}.quantity`] = quantity;
    }
    
    // Update the batch
    await Recipe.findOneAndUpdate(
      { _id: recipeId, owner: req.session.user!.id },
      { $set: updateData }
    );
    
    // Update inventory and planned production based on status changes
    if (oldStatus !== status) {
      const inventoryAdjustment: any = {};
      
      // Handle inventory changes based on status transitions
      if (oldStatus === "planned" && status === "completed") {
        // Planned -> Completed: Move from planned to inventory
        inventoryAdjustment.$inc = { 
          currentInventory: quantity || oldQuantity,
          plannedProduction: -(quantity || oldQuantity)
        };
      } else if (oldStatus === "in-progress" && status === "completed") {
        // In-progress -> Completed: Move from planned to inventory
        inventoryAdjustment.$inc = { 
          currentInventory: quantity || oldQuantity,
          plannedProduction: -(quantity || oldQuantity)
        };
      } else if (oldStatus === "planned" && status === "in-progress") {
        // Planned -> In-progress: No inventory change needed
      } else if (status === "cancelled") {
        // Any -> Cancelled: Remove from planned if it was planned
        if (oldStatus === "planned" || oldStatus === "in-progress") {
          inventoryAdjustment.$inc = { 
            plannedProduction: -(quantity || oldQuantity)
          };
        }
      }
      
      // Apply inventory adjustments if needed
      if (inventoryAdjustment.$inc) {
        await Recipe.findOneAndUpdate(
          { _id: recipeId, owner: req.session.user!.id },
          inventoryAdjustment
        );
      }
    }
    
    // Get the updated recipe
    const updatedRecipe = await Recipe.findOne({ 
      _id: recipeId,
      owner: req.session.user!.id
    });
    
    res.json(updatedRecipe);
  } catch (err) {
    console.error("Error updating batch status:", err);
    res.status(500).json({ message: "Error updating batch status" });
  }
});

// VERSION CONTROL ENDPOINTS

// Get version history
router.get("/:id/history", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the recipe
    const recipe = await Recipe.findOne({ 
      _id: req.params.id,
      owner: req.session.user!.id
    }).populate('versionHistory.modifiedBy', 'username');
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    res.json(recipe.versionHistory);
  } catch (err) {
    console.error("Error fetching version history:", err);
    res.status(500).json({ message: "Error fetching version history" });
  }
});

export default router;
