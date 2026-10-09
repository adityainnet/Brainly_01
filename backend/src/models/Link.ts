import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ILink extends Document {
  hash: string;
  userId: Types.ObjectId;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>(
  {
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

export const LinkModel: Model<ILink> =
  mongoose.models.Links || mongoose.model<ILink>("Links", LinkSchema);
