import express, { Request, Response, NextFunction } from "express";
import RecipeMachineYield from "../models/RecipeMachineYield";
import Machine from "../models/Machine";
import Recipe from "../models/Recipe";
import { authenticateUser } from "../middleware/auth";
import { Session } from "express-session";

const router = express.Router();

// Declare module to extend express-session
declare module "express-session" {
  interface SessionData {
    user?: {
      username: string;
      id: string;
      lastAccess: number;
    };
  }
}

// Define a custom request interface that includes the user
interface AuthRequest extends Request {
  user?: {
    username: string;
    id: string;
  };
  session: Session & { [key: string]: any };
}

// Auth middleware
const ensureAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

// Get all recipe-machine yields
router.get("/", authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const yields = await RecipeMachineYield.find()
      .populate("recipeId", "name")
      .populate("machineId", "name");

    res.json(yields);
  } catch (error: any) {
    console.error("Error fetching recipe-machine yields:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recipe-machine yields for a specific recipe
router.get(
  "/recipe/:recipeId",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const yields = await RecipeMachineYield.find({
        recipeId: req.params.recipeId,
      }).populate("machineId", "name");

      res.json(yields);
    } catch (error: any) {
      console.error("Error fetching recipe yields:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get recipe-machine yields for a specific machine
router.get(
  "/machine/:machineId",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const yields = await RecipeMachineYield.find({
        machineId: req.params.machineId,
      }).populate("recipeId", "name");

      res.json(yields);
    } catch (error: any) {
      console.error("Error fetching machine yields:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get a specific recipe-machine yield
router.get(
  "/:recipeId/:machineId",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const yield_ = await RecipeMachineYield.findOne({
        recipeId: req.params.recipeId,
        machineId: req.params.machineId,
      });

      if (!yield_) {
        return res.status(404).json({ message: "Yield data not found" });
      }

      res.json(yield_);
    } catch (error: any) {
      console.error("Error fetching yield:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Create a new recipe-machine yield
router.post("/", authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const { recipeId, machineId, tubsPerBatch, notes } = req.body;

    // Validate that recipe and machine exist
    const recipeExists = await Recipe.findById(recipeId);
    const machineExists = await Machine.findById(machineId);

    if (!recipeExists) {
      return res.status(400).json({ message: "Recipe not found" });
    }

    if (!machineExists) {
      return res.status(400).json({ message: "Machine not found" });
    }

    // Check if this combination already exists
    const existingYield = await RecipeMachineYield.findOne({
      recipeId,
      machineId,
    });

    if (existingYield) {
      return res.status(400).json({
        message:
          "Yield data for this recipe-machine combination already exists",
      });
    }

    const newYield = new RecipeMachineYield({
      recipeId,
      machineId,
      tubsPerBatch,
      notes,
      createdBy: req.session.user?.username || "system",
    });

    const savedYield = await newYield.save();
    res.status(201).json(savedYield);
  } catch (error: any) {
    console.error("Error creating yield:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update an existing recipe-machine yield
router.put(
  "/:id",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const { tubsPerBatch, notes } = req.body;

      const updatedYield = await RecipeMachineYield.findByIdAndUpdate(
        req.params.id,
        {
          tubsPerBatch,
          notes,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!updatedYield) {
        return res.status(404).json({ message: "Yield data not found" });
      }

      res.json(updatedYield);
    } catch (error: any) {
      console.error("Error updating yield:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete a recipe-machine yield
router.delete(
  "/:id",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const deletedYield = await RecipeMachineYield.findByIdAndDelete(
        req.params.id
      );

      if (!deletedYield) {
        return res.status(404).json({ message: "Yield data not found" });
      }

      res.json({ message: "Yield data deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting yield:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Calculate production time for a specific recipe, machine, and quantity
router.post(
  "/calculate-time",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const { machineId, recipeId, quantity } = req.body;

      if (!machineId || !recipeId || !quantity) {
        return res.status(400).json({
          message: "Machine ID, recipe ID, and quantity are required",
        });
      }

      // Use the static method we created on the model
      const calculationResult =
        await RecipeMachineYield.calculateProductionTime(
          machineId,
          recipeId,
          quantity
        );

      res.json(calculationResult);
    } catch (error: any) {
      console.error("Error calculating production time:", error);
      res.status(500).json({
        message: error.message || "Error calculating production time",
      });
    }
  }
);

export default router;
