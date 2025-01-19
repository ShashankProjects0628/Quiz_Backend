import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interest } from '../models/interest.schema';

@Injectable()
export class InterestRepository {
  constructor(
    @InjectModel('Interest') private readonly interestModel: Model<Interest>,
  ) {}

  async createInterest(name: string): Promise<any> {
    const newInterest = new this.interestModel({ name });
    return newInterest.save();
  }

  async findAll(): Promise<any[]> {
    return this.interestModel.find().exec();
  }

  async findByName(name: string): Promise<any> {
    return this.interestModel.findOne({ name }).exec();
  }
}
