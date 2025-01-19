import { Schema, Document, Types } from 'mongoose';

interface Choice {
  _id: Types.ObjectId;
  text: string;
}

export interface Question extends Document {
  text: string;
  type: string;
  choices: Choice[];
  correctAnswer: Types.ObjectId;
  tags: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export const QuestionSchema = new Schema<Question>(
  {
    text: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    choices: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        text: { type: String, required: true },
      },
    ],
    correctAnswer: { type: Schema.Types.ObjectId, required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Interest' }],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
