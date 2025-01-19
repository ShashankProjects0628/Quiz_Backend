import { Types } from 'mongoose';
import { Schema, Document } from 'mongoose';

export interface Score {
  userId: string; // ObjectId string
  score: number;
}

export interface QuizSession extends Document {
  participants: Types.ObjectId[]; // Array of User ObjectIds
  questions: Types.ObjectId[]; // Array of Question ObjectIds
  scores: Score[];
  status: 'ongoing' | 'completed';
  winnerId?: Types.ObjectId; // Optional ObjectId string
  createdAt: Date;
  updatedAt: Date;
}

export const QuizSessionSchema = new Schema<QuizSession>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    questions: [
      { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    ],
    scores: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        score: { type: Number, required: true, min: 0 },
      },
    ],
    status: { type: String, required: true, enum: ['ongoing', 'completed'] },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
