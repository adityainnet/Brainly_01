import mongoose, { Types } from "mongoose";
import { TagModel } from "../models";

/**
 * Resolves a list of tag names or IDs to Tag ObjectId references for a specific user.
 * If a tag name doesn't exist yet, it is created automatically.
 */
export async function resolveTagsForUser(
  rawTags: string[],
  userId: string | Types.ObjectId
): Promise<Types.ObjectId[]> {
  if (!rawTags || !Array.isArray(rawTags) || rawTags.length === 0) {
    return [];
  }

  const userObjectId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  const resolvedIds: Types.ObjectId[] = [];

  for (const raw of rawTags) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Check if it's already an existing ObjectId
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      const existingById = await TagModel.findOne({
        _id: trimmed,
        userId: userObjectId,
      });
      if (existingById) {
        resolvedIds.push(existingById._id as Types.ObjectId);
        continue;
      }
    }

    // Otherwise treat as tag name (normalized to lower case)
    const normalizedName = trimmed.toLowerCase().replace(/^#/, "");
    if (!normalizedName) continue;

    const existingByName = await TagModel.findOne({
      name: normalizedName,
      userId: userObjectId,
    });

    if (existingByName) {
      resolvedIds.push(existingByName._id as Types.ObjectId);
    } else {
      const createdTag = await TagModel.create({
        name: normalizedName,
        userId: userObjectId,
      });
      resolvedIds.push(createdTag._id as Types.ObjectId);
    }
  }

  return Array.from(new Set(resolvedIds.map((id) => id.toString()))).map(
    (id) => new mongoose.Types.ObjectId(id)
  );
}
