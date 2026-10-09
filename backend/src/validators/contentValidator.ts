import { z } from "zod";
import { CONTENT_TYPES } from "../models/Content";

export const createContentSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters"),
  type: z.enum(CONTENT_TYPES),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
});

export const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
