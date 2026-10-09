import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const CONTENT_TYPES = [
  "tweet",
  "youtube",
  "document",
  "link",
  "text",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export interface IContent extends Document {
  title: string;
  type: ContentType;
  link?: string;
  description?: string;
  userId: Types.ObjectId;
  tags: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: CONTENT_TYPES,
      lowercase: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ContentSchema.index({ userId: 1, createdAt: -1 });
ContentSchema.index({ userId: 1, type: 1 });
ContentSchema.index({ title: "text", description: "text" });

export const ContentModel: Model<IContent> =
  mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema);
