import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, default: 0 },
  preferred: { type: Boolean, default: false },
  supplierLink: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("Supplier", SupplierSchema);
