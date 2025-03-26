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

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://batchr.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("CORS origin check:", origin);

      if (!origin) {
        // Allow server-to-server or curl-like requests
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log the blocked origin to debug
      console.error("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    name: "batchr.sid",
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI!,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: "none",      // required for cross-origin cookies
      secure: true           // required for cross-origin cookies on HTTPS
    },
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
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ username: "admin" });
    if (!existing) {
      const adminUser = new User({ username: "admin", password: "123" });
      await adminUser.save();
      await seedAdminData(adminUser._id.toString());
      console.log("Seeded admin user and demo data");
    } else {
      console.log("Admin user already exists");
    }

    app.listen(process.env.PORT, () =>
      console.log(`🚀 Backend running at http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
