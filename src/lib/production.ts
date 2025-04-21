// Production Plan status options
export type ProductionPlanStatus =
  | "draft"
  | "active"
  | "completed"
  | "archived";

// Recipe in production plan
export interface PlanRecipe {
  recipeId: string;
  recipeInfo?: {
    name: string;
    _id: string;
  };
  plannedAmount: number;
  completedAmount: number;
}

// Main Production Plan interface
export interface ProductionPlan {
  _id: string;
  name: string;
  weekStartDate: Date;
  blocks: string[]; // References to ProductionBlock IDs
  completionStatus: number; // Percentage 0-100
  recipes: PlanRecipe[];
  notes?: string;
  status: ProductionPlanStatus;
  version: number;
  createdBy: string;
  createdAt: Date;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
  owner?: string;
}

// For creating a new production plan
export interface ProductionPlanCreateInput {
  name: string;
  weekStartDate: Date;
  recipes?: PlanRecipe[];
  notes?: string;
}

// For updating an existing production plan
export interface ProductionPlanUpdateInput {
  name?: string;
  notes?: string;
  status?: ProductionPlanStatus;
  recipes?: PlanRecipe[];
}

// Block type options for production activities
export type ProductionBlockType = "prep" | "production" | "cleaning";

// Status options for production blocks
export type ProductionBlockStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

// Main ProductionBlock interface
export interface ProductionBlock {
  _id: string;
  startTime: Date;
  endTime: Date;
  blockType: ProductionBlockType;
  machineId: string;
  employeeId: string;
  recipeId?: string;
  quantity?: number;
  status: ProductionBlockStatus;
  day: string;
  planId: string;
  notes?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualQuantity?: number;
  createdBy: string;
  createdAt: Date;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
  owner?: string;
}

// For creating a new production block
export interface ProductionBlockCreateInput {
  startTime: Date;
  endTime: Date;
  blockType: ProductionBlockType;
  machineId: string;
  employeeId: string;
  recipeId?: string;
  quantity?: number;
  planId: string;
  notes?: string;
}

// For updating an existing production block
export interface ProductionBlockUpdateInput {
  startTime?: Date;
  endTime?: Date;
  machineId?: string;
  employeeId?: string;
  recipeId?: string;
  quantity?: number;
  status?: ProductionBlockStatus;
  notes?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualQuantity?: number;
}

// Time calculation result for production planning
export interface TimeCalculation {
  productionMinutes: number;
  recommendedPrepMinutes: number;
  recommendedCleaningMinutes: number;
  totalMinutes: number;
}

// Schedule suggestion result for production planning
export interface ScheduleSuggestion {
  success: boolean;
  prepBlock?: { startTime: Date; endTime: Date };
  productionBlock?: { startTime: Date; endTime: Date };
  cleaningBlock?: { startTime: Date; endTime: Date };
  message?: string;
}
