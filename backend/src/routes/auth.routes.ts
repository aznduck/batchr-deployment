import express, { Request, Response } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import User from "../models/User";
import { seedAdminData } from "../utils/seedAdminData";
import Ingredient from "../models/Ingredient";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
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
    return res.status(400).json({ message: "Username and password are required" });
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

    // st session user
    req.session.user = { username: user.username };

    // save session before responding
    req.session.save(async (err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Failed to save session" });
      }

      // seed admin data if needed
      if (user.username === "admin") {
        const hasIngredients = await Ingredient.exists({ owner: user._id });
        if (!hasIngredients) {
          await seedAdminData(user._id.toString());
          console.log("Seeded data for admin!");
        }
      }

      res.status(200).json({ message: "Login successful" });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/auth/session
router.get("/session", (req: Request, res: Response) => {
  const sessionData = req.session as session.Session & {
    user?: { username: string };
  };

  if (sessionData.user) {
    res.json({ user: sessionData.user });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

export default router;
