import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import authRoutes from "./routes/auth.routes";
import dataRoutes from "./routes/data.routes";
import productionRoutes from "./routes/production.routes";
import employeesRoutes from "./routes/employees.routes";
import machinesRoutes from "./routes/machines.routes";
import recipesRoutes from "./routes/recipes.routes";
import productionPlansRoutes from "./routes/productionPlans.routes";
import productionBlocksRoutes from "./routes/productionBlocks.routes";
import recipeMachineYieldsRoutes from "./routes/recipeMachineYields";
import User from "./models/User";
import { seedAdminData } from "./utils/seedAdminData";

dotenv.config();
const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://batchr.vercel.app",
  "https://batchr-old.vercel.app",
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

declare module "express-session" {
  interface SessionData {
    user?: {
      username: string;
      id: string;
      lastAccess: number;
    };
  }
}

app.use(
  session({
    name: "batchr.sid",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI!,
      ttl: 24 * 60 * 60, // 1 day in seconds
      autoRemove: "native",
      touchAfter: 24 * 3600, // Only update session every 24 hours unless data changes
      crypto: {
        secret: false, // Disable encryption since we're having issues
      },
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    },
  })
);

// Log session data for debugging
app.use((req, res, next) => {
  console.log("Session data:", {
    id: req.sessionID,
    user: req.session.user,
    cookie: req.session.cookie,
  });
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api", dataRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/machines", machinesRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/production-plans", productionPlansRoutes);
app.use("/api/production-blocks", productionBlocksRoutes);
app.use("/api/recipe-machine-yields", recipeMachineYieldsRoutes);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Clear all existing sessions to avoid any encryption-related issues
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection("sessions").deleteMany({});
    }

    const existing = await User.findOne({ username: "admin" });
    if (!existing) {
      const hashedPassword = await bcrypt.hash("123", 10);
      const adminUser = new User({
        username: "admin",
        password: hashedPassword,
        isAdmin: true,
      });
      await adminUser.save();
      await seedAdminData(adminUser._id.toString());
      console.log("Seeded admin user and demo data");
    } else {
      console.log("Admin user already exists");
    }

    app.listen(process.env.PORT, () =>
      console.log(`🚀 Backend running at ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
