import { Schema, Document } from 'mongoose';

export interface User extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  refreshToken: string | null;
  interests: string[]; // Array of ObjectId strings
  city: string;
  state: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<User>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    refreshToken: { type: String, default: null },
    interests: [{ type: Schema.Types.ObjectId, ref: 'Interest' }],
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
