import express, { Request, Response, NextFunction } from "express";
import Employee from "../models/Employee";
import Machine from "../models/Machine";
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
const ensureAuth = async (
  req: AuthedRequest,
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

// EMPLOYEE ROUTES

// Get all employees
router.get("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const employees = await Employee.find({ owner: req.session.user!.id });
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Error fetching employees" });
  }
});

// Get employee by ID
router.get("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      owner: req.session.user!.id,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ message: "Error fetching employee" });
  }
});

// Create new employee
router.post("/", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const newEmployee = new Employee({
      ...req.body,
      owner: req.session.user!.id,
    });

    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    console.error("Error creating employee:", err);
    res.status(500).json({ message: "Error creating employee" });
  }
});

// Update employee
router.put("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user!.id },
      req.body,
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({ message: "Error updating employee" });
  }
});

// Delete employee
router.delete("/:id", ensureAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await Employee.findOneAndDelete({
      _id: req.params.id,
      owner: req.session.user!.id,
    });

    if (!result) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(204).end();
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ message: "Error deleting employee" });
  }
});

// AVAILABILITY ENDPOINTS

// Get available employees for a specific time range
router.get(
  "/available/:day/:startTime/:endTime",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { day, startTime, endTime } = req.params;

      // Validate day of week
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      if (!validDays.includes(day)) {
        return res.status(400).json({ message: "Invalid day parameter" });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return res
          .status(400)
          .json({ message: "Invalid time format. Use HH:MM" });
      }

      // Find employees with availability on the requested day and time
      const employees = await Employee.find({
        owner: req.session.user!.id,
        active: true,
      });

      // Filter employees based on their availability
      const availableEmployees = employees.filter((employee) => {
        const dayAvailability = employee.availability.get(day) || [];

        // Check if any of the employee's availability slots encompass the requested time range
        return dayAvailability.some((slot: any) => {
          return slot.startTime <= startTime && slot.endTime >= endTime;
        });
      });

      res.json(availableEmployees);
    } catch (err) {
      console.error("Error fetching available employees:", err);
      res.status(500).json({ message: "Error fetching available employees" });
    }
  }
);

// QUALIFICATION MANAGEMENT ENDPOINTS

// Add machine certification to employee
router.post(
  "/:id/certifications",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { machineId, certificationDate } = req.body;

      // Validate machine ID
      const machine = await Machine.findOne({
        _id: machineId,
        owner: req.session.user!.id,
      });

      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      // Find the employee
      const employee = await Employee.findOne({
        _id: req.params.id,
        owner: req.session.user!.id,
      });

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check if certification for this machine already exists
      const existingCert = employee.machineCertifications.find(
        (cert: any) => cert.machineId.toString() === machineId
      );

      if (existingCert) {
        return res
          .status(400)
          .json({ message: "Employee already certified for this machine" });
      }

      // Add certification
      employee.machineCertifications.push({
        machineId,
        certificationDate: certificationDate || new Date(),
      });

      await employee.save();
      res.status(201).json(employee);
    } catch (err) {
      console.error("Error adding certification:", err);
      res.status(500).json({ message: "Error adding certification" });
    }
  }
);

// Remove machine certification from employee
router.delete(
  "/:id/certifications/:machineId",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      // Find the employee
      const employee = await Employee.findOne({
        _id: req.params.id,
        owner: req.session.user!.id,
      });

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check if certification exists
      const certIndex = employee.machineCertifications.findIndex(
        (cert: any) => cert.machineId.toString() === req.params.machineId
      );

      if (certIndex === -1) {
        return res.status(404).json({ message: "Certification not found" });
      }

      // Remove certification
      employee.machineCertifications.splice(certIndex, 1);
      await employee.save();

      res.status(200).json(employee);
    } catch (err) {
      console.error("Error removing certification:", err);
      res.status(500).json({ message: "Error removing certification" });
    }
  }
);

// Get all employees certified for a specific machine
router.get(
  "/certified/:machineId",
  ensureAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      // Validate machine ID
      const machine = await Machine.findOne({
        _id: req.params.machineId,
        owner: req.session.user!.id,
      });

      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      // Find employees with certification for this machine
      const employees = await Employee.find({
        owner: req.session.user!.id,
        active: true,
        "machineCertifications.machineId": req.params.machineId,
      });

      res.json(employees);
    } catch (err) {
      console.error("Error fetching certified employees:", err);
      res.status(500).json({ message: "Error fetching certified employees" });
    }
  }
);

export default router;
