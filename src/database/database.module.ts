import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InterestSchema,
  UserSchema,
  QuestionSchema,
  QuizSessionSchema,
} from './models';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from './repositories/user.repository';
import { InterestRepository } from './repositories/interest.repository';
import { QuestionRepository } from './repositories/question.repository';
import { QuizSessionRepository } from './repositories/quiz_session.repository';

@Global()
@Module({
  imports: [
    // Establish the MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        retryDelay: 3000,
        retryAttempts: 5,
      }),
      inject: [ConfigService],
    }),
    // Register schemas
    MongooseModule.forFeature([
      { name: 'Interest', schema: InterestSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Question', schema: QuestionSchema },
      { name: 'QuizSession', schema: QuizSessionSchema },
    ]),
  ],
  exports: [
    MongooseModule,
    UserRepository,
    InterestRepository,
    QuestionRepository,
    QuizSessionRepository,
  ],
  providers: [
    UserRepository,
    InterestRepository,
    QuestionRepository,
    QuizSessionRepository,
  ],
})
export class DatabaseModule {}
