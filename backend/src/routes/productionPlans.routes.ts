import express, { Request, Response, NextFunction } from "express";
import ProductionPlan from "../models/ProductionPlan";
import ProductionBlock from "../models/ProductionBlock"; 
import Recipe from "../models/Recipe";
import { Document, Types } from "mongoose";
import { Session } from "express-session";
import * as fs from 'fs';
import * as path from 'path';

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

// PRODUCTION PLAN BASIC ROUTES

// Get all production plans
router.get("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const plans = await ProductionPlan.find({ 
      owner: req.session.user!.id 
    })
    .sort({ weekStartDate: -1 }) // Sort by date, newest first
    .populate('recipes.recipeId', 'name') // Populate recipe names
    .exec();
    
    res.json(plans);
  } catch (err) {
    console.error("Error fetching production plans:", err);
    res.status(500).json({ message: "Error fetching production plans" });
  }
});

// Get production plan by ID
router.get("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    })
    .populate('recipes.recipeId', 'name')
    .populate({
      path: 'blocks',
      populate: [
        { path: 'machineId', select: 'name tubCapacity' },
        { path: 'employeeId', select: 'name' },
        { path: 'recipeId', select: 'name' }
      ]
    })
    .exec();
    
    if (!plan) {
      return res.status(404).json({ message: "Production plan not found" });
    }
    
    res.json(plan);
  } catch (err) {
    console.error("Error fetching production plan:", err);
    res.status(500).json({ message: "Error fetching production plan" });
  }
});

// Create new production plan
router.post("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, weekStartDate, recipes, notes } = req.body;
    
    // Validate required fields
    if (!name || !weekStartDate) {
      return res.status(400).json({ message: "Name and weekStartDate are required" });
    }
    
    // Create new production plan
    const newPlan = new ProductionPlan({
      name,
      weekStartDate: new Date(weekStartDate),
      recipes: recipes || [],
      notes: notes || "",
      blocks: [],
      completionStatus: 0,
      status: "draft",
      version: 1,
      createdBy: req.session.user!.id,
      createdAt: new Date(),
      owner: req.session.user!.id
    });
    
    await newPlan.save();
    
    // If recipes are provided, validate and update recipe planned production
    if (recipes && recipes.length > 0) {
      for (const item of recipes) {
        // Validate recipe exists
        const recipe = await Recipe.findOne({ 
          _id: item.recipeId,
          owner: req.session.user!.id
        });
        
        if (!recipe) {
          continue; // Skip invalid recipes
        }
        
        // Update recipe planned production
        await Recipe.findByIdAndUpdate(
          item.recipeId,
          { 
            $inc: { plannedProduction: item.plannedAmount || 0 }
          }
        );
      }
    }
    
    res.status(201).json(newPlan);
  } catch (err) {
    console.error("Error creating production plan:", err);
    res.status(500).json({ message: "Error creating production plan" });
  }
});

// Update production plan
router.put("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, notes, status, recipes } = req.body;
    
    // Check if plan exists
    const existingPlan = await ProductionPlan.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!existingPlan) {
      return res.status(404).json({ message: "Production plan not found" });
    }
    
    // Build update object
    const updateData: any = {
      lastModifiedBy: req.session.user!.id,
      lastModifiedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;
    if (status) {
      // Validate status
      const validStatuses = ["draft", "active", "completed", "archived"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }
      updateData.status = status;
    }
    
    // Handle recipe changes if provided
    if (recipes && recipes.length > 0) {
      // Update planned production amounts for each recipe being changed
      const existingRecipes = existingPlan.recipes || [];
      
      // For each new recipe entry
      for (const newRecipe of recipes) {
        // Find matching existing recipe
        const existingRecipe = existingRecipes.find(
          (r: any) => r.recipeId.toString() === newRecipe.recipeId
        );
        
        if (existingRecipe) {
          // Recipe already in plan, adjust production difference
          const difference = newRecipe.plannedAmount - (existingRecipe.plannedAmount || 0);
          
          if (difference !== 0) {
            // Update recipe's planned production
            await Recipe.findByIdAndUpdate(
              newRecipe.recipeId,
              { $inc: { plannedProduction: difference } }
            );
          }
        } else {
          // New recipe added to plan
          await Recipe.findByIdAndUpdate(
            newRecipe.recipeId,
            { $inc: { plannedProduction: newRecipe.plannedAmount || 0 } }
          );
        }
      }
      
      // Handle removed recipes
      for (const existingRecipe of existingRecipes) {
        const stillExists = recipes.some(
          (r: any) => r.recipeId === existingRecipe.recipeId.toString()
        );
        
        if (!stillExists) {
          // Recipe removed from plan, subtract from planned production
          await Recipe.findByIdAndUpdate(
            existingRecipe.recipeId?.toString(),
            { $inc: { plannedProduction: -(existingRecipe.plannedAmount || 0) } }
          );
        }
      }
      
      // Update the recipes list in the plan
      updateData.recipes = recipes;
    }
    
    // Update version
    updateData.$inc = { version: 1 };
    
    // Update the plan
    const updatedPlan = await ProductionPlan.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      updateData,
      { new: true }
    )
    .populate('recipes.recipeId', 'name')
    .exec();
    
    res.json(updatedPlan);
  } catch (err) {
    console.error("Error updating production plan:", err);
    res.status(500).json({ message: "Error updating production plan" });
  }
});

// Delete production plan
router.delete("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the plan to get associated blocks and recipes
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!plan) {
      return res.status(404).json({ message: "Production plan not found" });
    }
    
    // Delete associated production blocks
    if (plan.blocks && plan.blocks.length > 0) {
      await ProductionBlock.deleteMany({
        _id: { $in: plan.blocks },
        owner: req.session.user!.id
      });
    }
    
    // Update recipe planned production amounts
    if (plan.recipes && plan.recipes.length > 0) {
      for (const recipeItem of plan.recipes) {
        await Recipe.findByIdAndUpdate(
          recipeItem.recipeId,
          { $inc: { plannedProduction: -(recipeItem.plannedAmount || 0) } }
        );
      }
    }
    
    // Delete the plan
    await ProductionPlan.findOneAndDelete({
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting production plan:", err);
    res.status(500).json({ message: "Error deleting production plan" });
  }
});

// SPECIALIZED PRODUCTION PLAN ENDPOINTS

// Complete production plan
router.put("/:id/complete", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the plan
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!plan) {
      return res.status(404).json({ message: "Production plan not found" });
    }
    
    // Check if plan can be completed
    if (plan.status === "completed") {
      return res.status(400).json({ message: "Production plan is already completed" });
    }
    
    if (plan.status === "archived") {
      return res.status(400).json({ message: "Archived plans cannot be completed" });
    }
    
    // Update all blocks to completed if not already
    if (plan.blocks && plan.blocks.length > 0) {
      await ProductionBlock.updateMany(
        {
          _id: { $in: plan.blocks },
          status: { $ne: "completed" },
          owner: req.session.user!.id
        },
        {
          status: "completed",
          lastModifiedBy: req.session.user!.id,
          lastModifiedAt: new Date()
        }
      );
      
      // Update recipe inventory and completed amounts for each production block
      const productionBlocks = await ProductionBlock.find({
        _id: { $in: plan.blocks },
        blockType: "production",
        owner: req.session.user!.id
      });
      
      for (const block of productionBlocks) {
        if (block.recipeId) {
          // Update recipe inventory with actual quantity or planned if not set
          const quantityToAdd = block.actualQuantity || block.quantity || 0;
          
          await Recipe.findByIdAndUpdate(
            block.recipeId?.toString(),
            { 
              $inc: { 
                currentInventory: quantityToAdd,
                plannedProduction: -(block.quantity || 0) // Remove from planned
              }
            }
          );
          
          // Find and update the recipe in the plan
          const recipeIndex = plan.recipes.findIndex(
            (r: any) => r.recipeId.toString() === block.recipeId.toString()
          );
          
          if (recipeIndex !== -1) {
            plan.recipes[recipeIndex].completedAmount += quantityToAdd;
          }
        }
      }
    }
    
    // Calculate completion status based on recipes
    let completionStatus = 100; // Assume 100% if no recipes
    if (plan.recipes && plan.recipes.length > 0) {
      let totalPlanned = 0;
      let totalCompleted = 0;
      
      for (const recipe of plan.recipes) {
        totalPlanned += recipe.plannedAmount || 0;
        totalCompleted += recipe.completedAmount || 0;
      }
      
      if (totalPlanned > 0) {
        completionStatus = Math.min(100, (totalCompleted / totalPlanned) * 100);
      }
    }
    
    // Update the plan
    const updatedPlan = await ProductionPlan.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      {
        status: "completed",
        completionStatus,
        lastModifiedBy: req.session.user!.id,
        lastModifiedAt: new Date(),
        recipes: plan.recipes // Update with the modified recipes array
      },
      { new: true }
    )
    .populate('recipes.recipeId', 'name')
    .exec();
    
    res.json(updatedPlan);
  } catch (err) {
    console.error("Error completing production plan:", err);
    res.status(500).json({ message: "Error completing production plan" });
  }
});

// Export production plan
router.get("/:id/export", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Find the plan with all related data
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      owner: req.session.user!.id
    })
    .populate('recipes.recipeId', 'name')
    .populate({
      path: 'blocks',
      populate: [
        { path: 'machineId', select: 'name tubCapacity' },
        { path: 'employeeId', select: 'name' },
        { path: 'recipeId', select: 'name' }
      ]
    })
    .exec();
    
    if (!plan) {
      return res.status(404).json({ message: "Production plan not found" });
    }
    
    // Format data for export
    const exportData = {
      planName: plan.name,
      weekStartDate: plan.weekStartDate,
      status: plan.status,
      completionStatus: plan.completionStatus,
      recipes: plan.recipes.map((recipe: any) => ({
        name: recipe.recipeId?.name || 'Unknown Recipe',
        plannedAmount: recipe.plannedAmount,
        completedAmount: recipe.completedAmount
      })),
      blocks: plan.blocks.map((block: any) => ({
        blockType: block.blockType,
        startTime: block.startTime,
        endTime: block.endTime,
        machine: block.machineId?.name || 'Unknown Machine',
        employee: block.employeeId?.name || 'Unknown Employee',
        recipe: block.recipeId?.name || 'N/A',
        quantity: block.quantity || 0,
        status: block.status
      }))
    };
    
    // Send export data
    res.json({ 
      exportedPlan: exportData,
      exportTimestamp: new Date()
    });
  } catch (err) {
    console.error("Error exporting production plan:", err);
    res.status(500).json({ message: "Error exporting production plan" });
  }
});

// Import production plan
router.post("/import", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { importData } = req.body;
    
    if (!importData || !importData.planName || !importData.weekStartDate) {
      return res.status(400).json({ message: "Invalid import data" });
    }
    
    // Create a new plan based on import data
    const newPlan = new ProductionPlan({
      name: `${importData.planName} (Imported)`,
      weekStartDate: new Date(importData.weekStartDate),
      recipes: [],
      blocks: [],
      completionStatus: 0,
      status: "draft",
      version: 1,
      createdBy: req.session.user!.id,
      createdAt: new Date(),
      owner: req.session.user!.id,
      notes: `Imported on ${new Date().toLocaleString()}`
    });
    
    await newPlan.save();
    
    // Process recipe references
    if (importData.recipes && importData.recipes.length > 0) {
      for (const recipeData of importData.recipes) {
        // Find recipe by name
        const recipe = await Recipe.findOne({ 
          name: recipeData.name,
          owner: req.session.user!.id
        });
        
        if (recipe) {
          // Add to plan recipes
          newPlan.recipes.push({
            recipeId: recipe._id,
            plannedAmount: recipeData.plannedAmount || 0,
            completedAmount: 0
          });
          
          // Update recipe planned production
          await Recipe.findByIdAndUpdate(
            recipe._id,
            { $inc: { plannedProduction: recipeData.plannedAmount || 0 } }
          );
        }
      }
    }
    
    // Save the plan with recipes
    await newPlan.save();
    
    // We don't import blocks directly as they need to be properly scheduled
    // and would require finding correct machine/employee references
    
    res.status(201).json({
      message: "Production plan imported successfully", 
      plan: newPlan
    });
  } catch (err) {
    console.error("Error importing production plan:", err);
    res.status(500).json({ message: "Error importing production plan" });
  }
});

export default router;
