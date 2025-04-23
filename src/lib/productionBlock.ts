import { Recipe } from "./data";
import { Machine } from "./machine";
import { Employee } from "./employee";

// Production block represents a scheduled activity
export interface ProductionBlock {
  _id: string;
  startTime: string | Date;
  endTime: string | Date;
  blockType: "prep" | "production" | "cleaning" | "maintenance";
  day: string;
  recipe?: Recipe;
  machine?: Machine;
  machineId?: Machine; // From API populate
  employeeId?: Employee; // From API populate
  assignedEmployee?: Employee;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  plannedQuantity?: number;
  actualQuantity?: number;
  notes?: string;
  planId?: string; // Reference to the associated production plan
  recipeId?: Recipe; // From API populate
  createdBy?: string; // From API
  createdAt?: string | Date; // From API
}

export default ProductionBlock;
