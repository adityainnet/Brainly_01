import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITag extends Document {
  name: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TagSchema.index({ name: 1, userId: 1 }, { unique: true });

export const TagModel: Model<ITag> =
  mongoose.models.Tag || mongoose.model<ITag>("Tag", TagSchema);
