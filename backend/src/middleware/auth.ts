import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      message: "Authentication token is required",
    });
    return;
  }

  // Support both "Bearer <token>" and raw token format
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    res.status(401).json({
      message: "Invalid token format",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.id) {
      res.status(401).json({
        message: "Invalid authentication token",
      });
      return;
    }

    req.userId = decoded.id as string;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        message: "Authentication token has expired. Please sign in again.",
      });
      return;
    }

    res.status(401).json({
      message: "Invalid or corrupted authentication token",
    });
  }
};

export const userMiddleware = authMiddleware;
