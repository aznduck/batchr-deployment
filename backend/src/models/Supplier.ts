import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  _id: String,
  name: String,
  rating: Number,
  preferred: Boolean,
  supplierLink: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("Supplier", SupplierSchema);
