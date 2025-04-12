import mongoose from "mongoose";

const ProductionBlockSchema = new mongoose.Schema(
  {
    // Time information
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    // Block type
    blockType: {
      type: String,
      enum: ["prep", "production", "cleaning"],
      required: true,
    },
    // Machine assignment
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    // Employee assignment
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // Recipe being produced (only required for production blocks)
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: function (this: any): boolean {
        return this.blockType === "production";
      },
    },
    // Production quantity in tubs
    quantity: {
      type: Number,
      required: function (this: any): boolean {
        return this.blockType === "production";
      },
      min: 0,
      get: (v: number) => parseFloat(v.toFixed(2)),
    },
    // Block status
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    // Associated production plan
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionPlan",
      required: true,
    },
    // Notes for the production block
    notes: {
      type: String,
    },
    // Actual production details (filled after completion)
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    actualQuantity: {
      type: Number,
      min: 0,
      get: (v: number) => parseFloat(v.toFixed(2)),
    },
    // Creator and creation time
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // Last modifier and modification time
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastModifiedAt: {
      type: Date,
    },
    // Owner (shop/business)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Add indexes for efficient scheduling and conflict detection
ProductionBlockSchema.index({ machineId: 1, startTime: 1, endTime: 1 });
ProductionBlockSchema.index({ employeeId: 1, startTime: 1, endTime: 1 });
ProductionBlockSchema.index({ planId: 1 });

export default mongoose.model("ProductionBlock", ProductionBlockSchema);
