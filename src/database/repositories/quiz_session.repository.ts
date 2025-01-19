import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuizSession } from '../models/quiz_session.schema';

@Injectable()
export class QuizSessionRepository {
  constructor(
    @InjectModel('QuizSession')
    private readonly quizSessionModel: Model<QuizSession>,
  ) {}

  async createQuizSession(
    quizPayload: Partial<QuizSession>,
  ): Promise<QuizSession> {
    const newUser = new this.quizSessionModel(quizPayload);
    return newUser.save();
  }

  async findById(id: string): Promise<QuizSession | null> {
    return this.quizSessionModel.findById(id);
  }

  async update(
    id: string,
    quizPayload: Partial<QuizSession>,
  ): Promise<QuizSession | null> {
    return this.quizSessionModel.findByIdAndUpdate(id, quizPayload);
  }
}
