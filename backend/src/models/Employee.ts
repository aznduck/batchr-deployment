import mongoose from "mongoose";

// Define the schema for shifts
const ShiftSchema = new mongoose.Schema({
  day: { 
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true 
  },
  startTime: { 
    type: String, // Store as HH:MM format
    required: true 
  },
  endTime: { 
    type: String, // Store as HH:MM format
    required: true 
  }
});

// Define the schema for machine certifications
const MachineCertificationSchema = new mongoose.Schema({
  machineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Machine",
    required: true 
  },
  certificationDate: { 
    type: Date,
    default: Date.now 
  }
});

// Define the main Employee schema
const EmployeeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String,
    unique: true 
  },
  shifts: [ShiftSchema],
  machineCertifications: [MachineCertificationSchema],
  // Weekly availability pattern
  availability: {
    type: Map,
    of: [{
      startTime: String, // HH:MM format
      endTime: String    // HH:MM format
    }],
    default: new Map([
      ["Monday", []],
      ["Tuesday", []],
      ["Wednesday", []],
      ["Thursday", []],
      ["Friday", []],
      ["Saturday", []],
      ["Sunday", []]
    ])
  },
  role: {
    type: String,
    enum: ["admin", "manager", "operator", "trainee"],
    default: "operator"
  },
  active: {
    type: Boolean,
    default: true
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Employee", EmployeeSchema);
