// Define the status types for machines
export type MachineStatus = "available" | "in-use" | "maintenance";

// Main Machine interface
export interface Machine {
  _id: string;
  name: string;
  tubCapacity: number; // 2, 4, or 8 tubs
  productionTime: number; // in minutes, default 30
  assignedEmployeeId: string | null;
  status: MachineStatus;
  notes: string;
  createdAt: Date;
  owner?: string;
}

// For creating a new machine
export interface MachineCreateInput {
  name: string;
  tubCapacity: number;
  productionTime?: number; // Optional, defaults to 30
  assignedEmployeeId?: string | null;
  status?: MachineStatus;
  notes?: string;
}
