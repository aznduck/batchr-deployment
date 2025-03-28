import { Request, Response, NextFunction } from "express";

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};
