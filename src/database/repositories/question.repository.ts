import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question } from '../models/question.schema';

@Injectable()
export class QuestionRepository {
  constructor(
    @InjectModel('Question') private readonly questionModel: Model<Question>,
  ) {}

  async createQuestion(user: Partial<Question>): Promise<Question> {
    const newUser = new this.questionModel(user);
    return newUser.save();
  }

  async findById(id: Types.ObjectId): Promise<Question | null> {
    return this.questionModel.findById(id);
  }

  async findQuestionsByInterests(interests: string[]): Promise<Question[]> {
    const interestIds = interests.map((id) => new Types.ObjectId(id));

    return this.questionModel
      .aggregate([
        {
          $match: {
            tags: { $in: interestIds },
          },
        },
        {
          $addFields: {
            matchingTags: {
              $size: {
                $setIntersection: ['$tags', interestIds],
              },
            },
          },
        },
        {
          $sort: {
            matchingTags: -1,
            createdAt: -1,
          },
        },
        {
          $limit: 5,
        },
      ])
      .exec();
  }

  async findQuestionWithoutCorrectAnswer(
    id: Types.ObjectId,
  ): Promise<Question | null> {
    return this.questionModel.findById(id).select('-correctAnswer');
  }
}
