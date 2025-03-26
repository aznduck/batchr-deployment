import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  id: String,
  name: String,
  rating: Number,
  preferred: Boolean,
});

export default mongoose.model("Supplier", SupplierSchema);
