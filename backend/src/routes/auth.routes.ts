import express, { Request, Response } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import User from "../models/User";
import Ingredient from "../models/Ingredient";
import { seedAdminData } from "../utils/seedAdminData";

const router = express.Router();

// Extend session to include user property
declare module "express-session" {
  interface SessionData {
    user?: { username: string };
  }
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      isAdmin: false, // New users are not admins by default
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set session data directly
    req.session.user = { username: user.username };
    console.log("Login: Setting session user to:", req.session.user);

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }

      // Send response after session is saved
      res.status(200).json({
        message: "Login successful",
        user: {
          username: user.username,
          isAdmin: user.isAdmin,
        },
      });

      // Seed data for admin if needed (after response sent)
      if (user.username === "admin") {
        Ingredient.exists({ owner: user._id }).then((hasIngredients) => {
          if (!hasIngredients) {
            seedAdminData(user._id.toString()).then(() => {
              console.log(" Seeded data for admin!");
            });
          }
        });
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie("batchr.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  } else {
    res.status(200).json({ message: "Already logged out" });
  }
});

// GET /api/auth/session
router.get("/session", async (req: Request, res: Response) => {
  try {
    console.log("Session check:", req.session);
    
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findOne({ username: req.session.user.username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
    });
  } catch (err) {
    console.error("Session error:", err);
    res.status(500).json({ message: "Error fetching session" });
  }
});

// sanity check (user session data)
router.get("/debug", (req, res) => {
  console.log("Session in /debug route:", req.session);
  res.json({ session: req.session });
});

export default router;
