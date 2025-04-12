import mongoose from "mongoose";

const MachineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tubCapacity: {
    type: Number,
    required: true,
    min: 1,
  },
  productionTime: {
    type: Number,
    required: true,
    default: 30, // Default 30 minutes
    min: 1,
  },
  assignedEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    default: null,
  },
  status: {
    type: String,
    enum: ["available", "in-use", "maintenance"],
    default: "available",
  },
  notes: {
    type: String,
    default: "",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Machine", MachineSchema);
