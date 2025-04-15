import { Recipe } from "./data";
import { Machine } from "./machine";
import { Employee } from "./employee";

// Production block represents a scheduled activity
export interface ProductionBlock {
  _id: string;
  startTime: string | Date;
  endTime: string | Date;
  blockType: "prep" | "production" | "cleaning" | "maintenance";
  recipe?: Recipe;
  machine?: Machine;
  assignedEmployee?: Employee;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  plannedQuantity?: number;
  actualQuantity?: number;
  notes?: string;
}

export default ProductionBlock;
