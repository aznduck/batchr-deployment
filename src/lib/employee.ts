export interface Shift {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

export interface MachineCertification {
  machineId: string;
  certificationDate: Date;
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

export type DayAvailability = Record<string, TimeSlot[]>;

export type EmployeeRole = "admin" | "manager" | "operator" | "trainee";

export interface Employee {
  _id: string;
  name: string;
  email?: string;
  shifts: Shift[];
  machineCertifications: MachineCertification[];
  availability: DayAvailability;
  role: EmployeeRole;
  active: boolean;
  createdAt: Date;
  owner?: string;
}
