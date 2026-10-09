import { Request, Response } from "express";
import crypto from "crypto";
import { LinkModel, UserModel, ContentModel } from "../models";
import { AuthRequest } from "../middleware/auth";

export const shareBrain = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { share } = req.body;

  try {
    // If share is explicitly false, revoke link
    if (share === false) {
      await LinkModel.findOneAndDelete({ userId: req.userId });
      res.status(200).json({ message: "Removed link" });
      return;
    }

    // Otherwise enable or retrieve active share link
    const existingLink = await LinkModel.findOne({ userId: req.userId });
    if (existingLink) {
      if (!existingLink.isActive) {
        existingLink.isActive = true;
        await existingLink.save();
      }
      res.status(200).json({
        hash: existingLink.hash,
        message: "Share link retrieved successfully",
      });
      return;
    }

    // Generate a clean secure random hash (e.g. 16 hex chars)
    const hash = crypto.randomBytes(8).toString("hex");

    const newLink = await LinkModel.create({
      userId: req.userId,
      hash,
      isActive: true,
    });

    res.status(201).json({
      hash: newLink.hash,
      message: "Share link created successfully",
    });
  } catch (error: any) {
    console.error("Share brain error:", error);
    res.status(500).json({ message: "Failed to configure brain sharing" });
  }
};

export const revokeShare = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await LinkModel.findOneAndDelete({ userId: req.userId });
    res.status(200).json({ message: "Removed link" });
  } catch (error: any) {
    console.error("Revoke share error:", error);
    res.status(500).json({ message: "Failed to revoke share link" });
  }
};

export const getSharedBrain = async (
  req: Request,
  res: Response
): Promise<void> => {
  const hash = req.params.shareLink;

  if (!hash || typeof hash !== "string") {
    res.status(400).json({ message: "Invalid share link token" });
    return;
  }

  try {
    const link = await LinkModel.findOne({ hash, isActive: true });

    if (!link) {
      res.status(404).json({
        message: "Shared brain link not found or sharing has been revoked",
      });
      return;
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      res.status(410).json({
        message: "This shared brain link has expired",
      });
      return;
    }

    const user = await UserModel.findById(link.userId).select("username");
    if (!user) {
      res.status(404).json({
        message: "The owner of this brain does not exist",
      });
      return;
    }

    const content = await ContentModel.find({ userId: link.userId })
      .sort({ createdAt: -1 })
      .populate("tags", "name");

    res.status(200).json({
      username: user.username,
      content,
    });
  } catch (error: any) {
    console.error("Get shared brain error:", error);
    res.status(500).json({ message: "Failed to retrieve shared brain" });
  }
};
