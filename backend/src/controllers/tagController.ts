import { Response } from "express";
import mongoose from "mongoose";
import { TagModel, ContentModel } from "../models";
import { AuthRequest } from "../middleware/auth";

const parseParamId = (param: unknown): string => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && typeof param[0] === "string") return param[0];
  return "";
};

export const getTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tags = await TagModel.find({ userId: req.userId }).sort({ name: 1 });
    res.status(200).json({ tags });
  } catch (error: any) {
    console.error("Get tags error:", error);
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

export const createTag = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Tag name is required" });
    return;
  }

  const cleanName = name.trim().toLowerCase().replace(/^#/, "");

  try {
    const existing = await TagModel.findOne({
      name: cleanName,
      userId: req.userId,
    });

    if (existing) {
      res.status(200).json({
        message: "Tag already exists",
        tag: existing,
      });
      return;
    }

    const tag = await TagModel.create({
      name: cleanName,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    res.status(201).json({
      message: "Tag created successfully",
      tag,
    });
  } catch (error: any) {
    console.error("Create tag error:", error);
    res.status(500).json({ message: "Failed to create tag" });
  }
};

export const deleteTag = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseParamId(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid tag ID" });
    return;
  }

  try {
    const deleted = await TagModel.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      res.status(404).json({ message: "Tag not found or unauthorized" });
      return;
    }

    // Pull tag reference from any content items that use it
    await ContentModel.updateMany(
      { userId: req.userId, tags: id },
      { $pull: { tags: id } }
    );

    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (error: any) {
    console.error("Delete tag error:", error);
    res.status(500).json({ message: "Failed to delete tag" });
  }
};
