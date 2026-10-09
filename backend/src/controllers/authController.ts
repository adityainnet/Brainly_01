import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models";
import { signupSchema, signinSchema } from "../validators/authValidator";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config";
import { AuthRequest } from "../middleware/auth";

export const signup = async (req: Request, res: Response): Promise<void> => {
  const parseResult = signupSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg =
      parseResult.error.issues?.[0]?.message || "Invalid input data";
    res.status(400).json({
      message: errorMsg,
      issues: parseResult.error.issues,
    });
    return;
  }

  const { username, password, email } = parseResult.data;

  try {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      res.status(409).json({
        message: "Username is already taken",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      username,
      email: email || undefined,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Internal server error during registration",
    });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  const parseResult = signinSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg =
      parseResult.error.issues?.[0]?.message || "Invalid credentials format";
    res.status(400).json({
      message: errorMsg,
    });
    return;
  }

  const { username, password } = parseResult.data;

  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      res.status(403).json({
        message: "Incorrect credentials",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(403).json({
        message: "Incorrect credentials",
      });
      return;
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    res.status(200).json({
      message: "Signed in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Signin error:", error);
    res.status(500).json({
      message: "Internal server error during signin",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Failed to retrieve user profile" });
  }
};
