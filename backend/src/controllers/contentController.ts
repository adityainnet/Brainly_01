import { Response } from "express";
import mongoose from "mongoose";
import { ContentModel, TagModel } from "../models";
import { AuthRequest } from "../middleware/auth";
import {
  createContentSchema,
  updateContentSchema,
} from "../validators/contentValidator";
import { resolveTagsForUser } from "../utils/tagHelper";

const parseParamId = (param: unknown): string => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && typeof param[0] === "string") return param[0];
  return "";
};

export const createContent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const parseResult = createContentSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg =
      parseResult.error.issues?.[0]?.message || "Validation failed";
    res.status(400).json({
      message: errorMsg,
      issues: parseResult.error.issues,
    });
    return;
  }

  const { title, type, link, description, tags } = parseResult.data;

  try {
    const resolvedTagIds = await resolveTagsForUser(tags, req.userId!);

    const newContent = await ContentModel.create({
      title,
      type,
      link: link || "",
      description: description || "",
      userId: new mongoose.Types.ObjectId(req.userId),
      tags: resolvedTagIds,
    });

    const populated = await ContentModel.findById(newContent._id)
      .populate("tags", "name")
      .populate("userId", "username");

    res.status(201).json({
      message: "Content created successfully",
      content: populated,
    });
  } catch (error: any) {
    console.error("Create content error:", error);
    res.status(500).json({ message: "Failed to create content item" });
  }
};

export const getContentList = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { search, type, tag, page = "1", limit = "50" } = req.query;

    const queryFilter: any = { userId };

    if (type && typeof type === "string" && type !== "all") {
      queryFilter.type = type.toLowerCase();
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      queryFilter.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    if (tag && typeof tag === "string" && tag.trim() !== "") {
      const cleanTagName = tag.trim().toLowerCase().replace(/^#/, "");
      const matchedTag = await TagModel.findOne({
        name: cleanTagName,
        userId,
      });

      if (matchedTag) {
        queryFilter.tags = matchedTag._id;
      } else if (mongoose.Types.ObjectId.isValid(cleanTagName)) {
        queryFilter.tags = new mongoose.Types.ObjectId(cleanTagName);
      } else {
        res.status(200).json({
          content: [],
          total: 0,
          page: Number(page),
          limit: Number(limit),
        });
        return;
      }
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, content] = await Promise.all([
      ContentModel.countDocuments(queryFilter),
      ContentModel.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("tags", "name")
        .populate("userId", "username"),
    ]);

    res.status(200).json({
      content,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error: any) {
    console.error("Get content list error:", error);
    res.status(500).json({ message: "Failed to fetch content items" });
  }
};

export const getContentById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = parseParamId(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid content ID format" });
    return;
  }

  try {
    const item = await ContentModel.findOne({
      _id: id,
      userId: req.userId,
    })
      .populate("tags", "name")
      .populate("userId", "username");

    if (!item) {
      res.status(404).json({ message: "Content item not found" });
      return;
    }

    res.status(200).json({ content: item });
  } catch (error: any) {
    console.error("Get content by id error:", error);
    res.status(500).json({ message: "Failed to retrieve content item" });
  }
};

export const updateContent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = parseParamId(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid content ID format" });
    return;
  }

  const parseResult = updateContentSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg =
      parseResult.error.issues?.[0]?.message || "Validation failed";
    res.status(400).json({
      message: errorMsg,
      issues: parseResult.error.issues,
    });
    return;
  }

  try {
    const item = await ContentModel.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!item) {
      res.status(404).json({ message: "Content item not found or unauthorized" });
      return;
    }

    const { title, type, link, description, tags } = parseResult.data;

    if (title !== undefined) item.title = title;
    if (type !== undefined) item.type = type;
    if (link !== undefined) item.link = link;
    if (description !== undefined) item.description = description;

    if (tags !== undefined) {
      item.tags = await resolveTagsForUser(tags, req.userId!);
    }

    await item.save();

    const updated = await ContentModel.findById(item._id)
      .populate("tags", "name")
      .populate("userId", "username");

    res.status(200).json({
      message: "Content updated successfully",
      content: updated,
    });
  } catch (error: any) {
    console.error("Update content error:", error);
    res.status(500).json({ message: "Failed to update content item" });
  }
};

export const deleteContent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const rawId = req.params.id || req.body.contentId;
  const id = parseParamId(rawId);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Valid contentId is required" });
    return;
  }

  try {
    const deleted = await ContentModel.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      res.status(404).json({
        message: "Content not found or unauthorized to delete",
      });
      return;
    }

    res.status(200).json({
      message: "Content deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete content error:", error);
    res.status(500).json({ message: "Failed to delete content" });
  }
};
