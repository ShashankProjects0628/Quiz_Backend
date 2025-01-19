import { Schema, Document } from 'mongoose';

export interface Interest extends Document {
  name: string;
}

export const InterestSchema = new Schema<Interest>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
