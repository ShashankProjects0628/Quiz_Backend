import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../models/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async createUser(user: Partial<User>): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findBySimilarInterests(
    userId: string,
    interests: string[],
    activeUsers: string[],
    occupiedUsers: string[],
  ): Promise<User[]> {
    const interestIds = interests.map((id) => new Types.ObjectId(id));
    const activeUserIds = activeUsers.map((id) => new Types.ObjectId(id));
    const occupiedUserIds = occupiedUsers.map((id) => new Types.ObjectId(id));

    // Get users with similar interests
    const similarUsers = await this.userModel
      .aggregate([
        {
          $match: {
            _id: {
              $nin: [new Types.ObjectId(userId), ...occupiedUserIds],
              $in: activeUserIds,
            },
            interests: { $in: interestIds },
          },
        },
        {
          $addFields: {
            matchingInterests: {
              $size: {
                $setIntersection: ['$interests', interestIds],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'quizSessions',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$$userId', '$participants'] },
                      { $in: [new Types.ObjectId(userId), '$participants'] },
                      {
                        $gte: [
                          '$createdAt',
                          new Date(Date.now() - 24 * 60 * 60 * 1000),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'recentSessions',
          },
        },
        {
          $addFields: {
            sessionCount: { $size: '$recentSessions' },
          },
        },
        {
          $sort: {
            sessionCount: 1,
            matchingInterests: -1,
          },
        },
        {
          $limit: 1,
        },
      ])
      .exec();

    return similarUsers;
  }
}
