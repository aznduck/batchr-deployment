import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes";
import dataRoutes from "./routes/data.routes";
import User from "./models/User";
import { seedAdminData } from "./utils/seedAdminData";

dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:8080",
  "https://batchr.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI!,
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use((req, res, next) => {
  console.log("Session data:", req.session);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api", dataRoutes);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ username: "admin" });
    if (!existing) {
      const adminUser = new User({ username: "admin", password: "123" });
      await adminUser.save();
      await seedAdminData(adminUser._id.toString());
      console.log("🌱 Seeded admin user and demo data");
    } else {
      console.log("👤 Admin user already exists");
    }

    app.listen(process.env.PORT, () =>
      console.log(`🚀 Backend running at http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
