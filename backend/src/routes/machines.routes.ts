import express, { Request, Response, NextFunction } from "express";
import Machine from "../models/Machine";
import Employee from "../models/Employee";
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

// MACHINE ROUTES

// Get all machines
router.get("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const machines = await Machine.find({ owner: req.session.user!.id });
    res.json(machines);
  } catch (err) {
    console.error("Error fetching machines:", err);
    res.status(500).json({ message: "Error fetching machines" });
  }
});

// Get machine by ID
router.get("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const machine = await Machine.findOne({ 
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    
    res.json(machine);
  } catch (err) {
    console.error("Error fetching machine:", err);
    res.status(500).json({ message: "Error fetching machine" });
  }
});

// Create new machine
router.post("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const newMachine = new Machine({
      ...req.body,
      owner: req.session.user!.id
    });
    
    await newMachine.save();
    res.status(201).json(newMachine);
  } catch (err) {
    console.error("Error creating machine:", err);
    res.status(500).json({ message: "Error creating machine" });
  }
});

// Update machine
router.put("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      req.body,
      { new: true }
    );
    
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    
    res.json(machine);
  } catch (err) {
    console.error("Error updating machine:", err);
    res.status(500).json({ message: "Error updating machine" });
  }
});

// Delete machine
router.delete("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await Machine.findOneAndDelete({ 
      _id: req.params.id,
      owner: req.session.user!.id
    });
    
    if (!result) {
      return res.status(404).json({ message: "Machine not found" });
    }
    
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting machine:", err);
    res.status(500).json({ message: "Error deleting machine" });
  }
});

// STATUS MANAGEMENT ENDPOINTS

// Update machine status
router.put("/:id/status", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ["available", "in-use", "maintenance"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      { status },
      { new: true }
    );
    
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    
    res.json(machine);
  } catch (err) {
    console.error("Error updating machine status:", err);
    res.status(500).json({ message: "Error updating machine status" });
  }
});

// Assign employee to machine
router.put("/:id/assign", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { employeeId } = req.body;
    
    // If employeeId is null, we're unassigning
    if (employeeId === null) {
      const machine = await Machine.findOneAndUpdate(
        { _id: req.params.id, owner: req.session.user!.id },
        { 
          assignedEmployeeId: null,
          status: "available" 
        },
        { new: true }
      );
      
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }
      
      return res.json(machine);
    }
    
    // Validate employee exists and is certified for this machine
    const employee = await Employee.findOne({ 
      _id: employeeId,
      owner: req.session.user!.id
    });
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    // Check if employee is certified for this machine
    const isCertified = employee.machineCertifications.some(
      (cert: any) => cert.machineId.toString() === req.params.id
    );
    
    if (!isCertified) {
      return res.status(400).json({ 
        message: "Employee is not certified to operate this machine" 
      });
    }
    
    // Update the machine
    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      { 
        assignedEmployeeId: employeeId,
        status: "in-use" 
      },
      { new: true }
    );
    
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    
    res.json(machine);
  } catch (err) {
    console.error("Error assigning employee to machine:", err);
    res.status(500).json({ message: "Error assigning employee to machine" });
  }
});

// CAPACITY AND CONFIGURATION ENDPOINTS

// Get machines by capacity
router.get("/capacity/:minCapacity", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const minCapacity = parseInt(req.params.minCapacity);
    
    if (isNaN(minCapacity) || minCapacity < 1) {
      return res.status(400).json({ message: "Invalid capacity parameter" });
    }
    
    const machines = await Machine.find({ 
      owner: req.session.user!.id,
      tubCapacity: { $gte: minCapacity }
    });
    
    res.json(machines);
  } catch (err) {
    console.error("Error fetching machines by capacity:", err);
    res.status(500).json({ message: "Error fetching machines by capacity" });
  }
});

// Get available machines (not in use or maintenance)
router.get("/available", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const machines = await Machine.find({ 
      owner: req.session.user!.id,
      status: "available"
    });
    
    res.json(machines);
  } catch (err) {
    console.error("Error fetching available machines:", err);
    res.status(500).json({ message: "Error fetching available machines" });
  }
});

// Update machine configuration
router.put("/:id/configure", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { tubCapacity, productionTime } = req.body;
    
    // Validate inputs
    if (tubCapacity !== undefined && (isNaN(tubCapacity) || tubCapacity < 1)) {
      return res.status(400).json({ message: "Invalid tub capacity" });
    }
    
    if (productionTime !== undefined && (isNaN(productionTime) || productionTime < 1)) {
      return res.status(400).json({ message: "Invalid production time" });
    }
    
    // Build update object
    const updateData: any = {};
    if (tubCapacity !== undefined) updateData.tubCapacity = tubCapacity;
    if (productionTime !== undefined) updateData.productionTime = productionTime;
    
    // Update the machine
    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      updateData,
      { new: true }
    );
    
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    
    res.json(machine);
  } catch (err) {
    console.error("Error updating machine configuration:", err);
    res.status(500).json({ message: "Error updating machine configuration" });
  }
});

export default router;
