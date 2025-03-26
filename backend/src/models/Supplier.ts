import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  id: String,
  name: String,
  rating: Number,
  preferred: Boolean,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("Supplier", SupplierSchema);
