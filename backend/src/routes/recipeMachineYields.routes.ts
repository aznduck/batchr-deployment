import express from "express";
import { authenticateUser } from "../middleware/auth";
import RecipeMachineYield from "../models/RecipeMachineYield";
import mongoose from "mongoose";

const router = express.Router();

// Get all recipe-machine yields
router.get("/", authenticateUser, async (req, res) => {
  try {
    const yields = await RecipeMachineYield.find({
      createdBy: req.session.user!.id,
    })
      .populate("recipeId")
      .populate("machineId");
    res.json(yields);
  } catch (err) {
    console.error("Error fetching recipe machine yields:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all recipe-machine yields for a specific recipe
router.get("/by-recipe/:recipeId", authenticateUser, async (req, res) => {
  try {
    const recipeId = req.params.recipeId;
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: "Invalid recipe ID format" });
    }
    
    const yields = await RecipeMachineYield.find({
      recipeId: recipeId,
      createdBy: req.session.user!.id,
    })
      .populate("machineId");
      
    res.json(yields);
  } catch (err) {
    console.error("Error fetching yields by recipe:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all recipe-machine yields for a specific machine
router.get("/by-machine/:machineId", authenticateUser, async (req, res) => {
  try {
    const machineId = req.params.machineId;
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return res.status(400).json({ message: "Invalid machine ID format" });
    }
    
    const yields = await RecipeMachineYield.find({
      machineId: machineId,
      createdBy: req.session.user!.id,
    })
      .populate("recipeId");
      
    res.json(yields);
  } catch (err) {
    console.error("Error fetching yields by machine:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recipe-machine yield by ID
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const yield_ = await RecipeMachineYield.findOne({
      _id: req.params.id,
      createdBy: req.session.user!.id,
    })
      .populate("recipeId")
      .populate("machineId");

    if (!yield_) {
      return res.status(404).json({ message: "Recipe-machine yield not found" });
    }

    res.json(yield_);
  } catch (err) {
    console.error("Error fetching recipe machine yield:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new recipe-machine yield
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { recipeId, machineId, tubsPerBatch, notes } = req.body;

    // Check for required fields
    if (!recipeId || !machineId || !tubsPerBatch) {
      return res.status(400).json({
        message: "recipeId, machineId, and tubsPerBatch are required",
      });
    }

    // Check if this combination already exists
    const existingYield = await RecipeMachineYield.findOne({
      recipeId,
      machineId,
      createdBy: req.session.user!.id,
    });

    if (existingYield) {
      return res.status(400).json({
        message: "A yield record for this recipe-machine combination already exists",
      });
    }

    // Create new yield record
    const newYield = new RecipeMachineYield({
      recipeId,
      machineId,
      tubsPerBatch,
      notes: notes || "",
      createdBy: req.session.user!.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newYield.save();

    // Return the saved record with populated references
    const populatedYield = await RecipeMachineYield.findById(newYield._id)
      .populate("recipeId")
      .populate("machineId");

    res.status(201).json(populatedYield);
  } catch (err) {
    console.error("Error creating recipe machine yield:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a recipe-machine yield
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { tubsPerBatch, notes } = req.body;
    const yieldId = req.params.id;

    // Find and update the yield
    const updatedYield = await RecipeMachineYield.findOneAndUpdate(
      {
        _id: yieldId,
        createdBy: req.session.user!.id,
      },
      {
        $set: {
          tubsPerBatch,
          notes: notes || "",
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate("recipeId")
      .populate("machineId");

    if (!updatedYield) {
      return res.status(404).json({ message: "Recipe-machine yield not found" });
    }

    res.json(updatedYield);
  } catch (err) {
    console.error("Error updating recipe machine yield:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a recipe-machine yield
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const yieldId = req.params.id;

    const result = await RecipeMachineYield.deleteOne({
      _id: yieldId,
      createdBy: req.session.user!.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Recipe-machine yield not found" });
    }

    res.json({ message: "Recipe-machine yield deleted successfully" });
  } catch (err) {
    console.error("Error deleting recipe machine yield:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
