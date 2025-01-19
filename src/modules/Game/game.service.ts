import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { UserRepository } from '../../database/repositories/user.repository';
import { QuizSessionRepository } from '../../database/repositories/quiz_session.repository';
import { QuestionRepository } from '../../database/repositories/question.repository';
import { RedisService } from 'src/redis/redis.service';
import { Types } from 'mongoose';
import { SocketService } from 'src/socket/socket.service';
import { QuizSession, Score } from 'src/database/models/quiz_session.schema';
import { REDIS_KEYS } from 'src/constants/redis';
import { SOCKET_EVENTS } from 'src/constants/socket';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly quizSessionRepository: QuizSessionRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly redisService: RedisService,

    @Inject(forwardRef(() => SocketService))
    private readonly socketService: SocketService,
  ) {}

  // Match a participant with a suitable opponent
  async matchParticipant(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const activeUsersPromise = this.redisService.fetchRecordsFromSortedSets({
      setName: REDIS_KEYS.ACTIVE_USERS,
    });

    const occupiedUsersPromise = this.redisService.fetchRecordsFromSortedSets({
      setName: REDIS_KEYS.OCCUPIED_USERS,
    });

    const [activeUsers, occupiedUsers] = await Promise.all([
      activeUsersPromise,
      occupiedUsersPromise,
    ]);

    const potentialParticipants =
      await this.userRepository.findBySimilarInterests(
        user._id.toString(),
        user.interests,
        activeUsers,
        occupiedUsers,
      );

    return potentialParticipants[0] || null; // Return the best match or null
  }

  // Validate that the user is currently not occupied
  async validateUser(userId: string) {
    const occupiedUsers = await this.redisService.fetchRecordsFromSortedSets({
      setName: REDIS_KEYS.OCCUPIED_USERS,
    });
    return !occupiedUsers.includes(userId);
  }

  // Creating quiz session and select questions for the quiz session
  async createQuizSession(userId: string, matchedParticipant: any) {
    const questions = await this.questionRepository.findQuestionsByInterests([
      ...matchedParticipant.interests,
    ]);

    const selectedQuestions = questions.slice(0, 4); // Select 4 questions

    await this.redisService.setRecordsInSortedSets(REDIS_KEYS.OCCUPIED_USERS, [
      {
        score: Date.now(),
        value: matchedParticipant._id.toString(),
      },
      {
        score: Date.now(),
        value: userId.toString(),
      },
    ]);
    const quizSession = await this.quizSessionRepository.createQuizSession({
      participants: [new Types.ObjectId(userId), matchedParticipant._id],
      questions: selectedQuestions.map(
        (q) => new Types.ObjectId(q._id.toString()),
      ),
      scores: [
        { userId: new Types.ObjectId(userId), score: 0 },
        { userId: matchedParticipant._id, score: 0 },
      ],
      status: 'ongoing',
    });

    return quizSession;
  }

  // Start the quiz session and send questions to participants
  async startQuizSession(quizSession: QuizSession) {
    try {
      const room = `quiz:${quizSession._id.toString()}`;

      // Merge all participants into the quiz room
      quizSession.participants.forEach((participant) => {
        this.socketService.joinRoom(room, participant.toString());
      });

      // Notify participants of game start
      const firstQuestion =
        await this.questionRepository.findQuestionWithoutCorrectAnswer(
          quizSession.questions[0],
        );

      this.socketService.emitEvent(
        SOCKET_EVENTS.GAME_INIT,
        {
          quizId: quizSession._id.toString(),
          question: firstQuestion,
        },
        room,
      );

      // Start sending questions
      for (let i = 0; i < quizSession.questions.length; i++) {
        quizSession = await this.quizSessionRepository.findById(
          quizSession._id.toString(),
        );
        const question =
          await this.questionRepository.findQuestionWithoutCorrectAnswer(
            quizSession.questions[i],
          );

        this.socketService.emitEvent(
          SOCKET_EVENTS.QUESTION_SEND,
          {
            question,
            scores: quizSession.scores,
          },
          room,
        );

        // Wait for 30 seconds before sending the next question
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }

      // End the game and calculate results
      const winner = this.calculateWinner(quizSession.scores);
      this.socketService.emitEvent(
        SOCKET_EVENTS.GAME_END,
        {
          scores: quizSession.scores,
          winner,
        },
        room,
      );

      // Save the final results
      await this.quizSessionRepository.update(quizSession._id.toString(), {
        scores: quizSession.scores,
        winnerId: winner ? new Types.ObjectId(winner.toString()) : null,
        status: 'completed',
      });

      //  Remove participants from the occupied users list
      await this.redisService.deleteRecordFromSortedSets(
        REDIS_KEYS.OCCUPIED_USERS,
        quizSession.participants.map((p) => p.toString()),
      );
    } catch (error) {
      this.logger.error(`Error starting quiz session: ${error}`);
    }
  }

  // Submit answer and update scores
  async submitAnswer(
    quizSessionId: string,
    userId: string,
    questionId: Types.ObjectId,
    selectedOption: string,
  ) {
    const quizSession =
      await this.quizSessionRepository.findById(quizSessionId);
    const question = await this.questionRepository.findById(questionId);

    if (!quizSession || !question) return null;
    // Check if the selected answer is correct
    if (question.correctAnswer.toString() === selectedOption) {
      // Find the participant in the scores array
      const participant = quizSession.scores.find(
        (score) => score.userId.toString() === userId,
      );

      if (participant) {
        // Increment the participant's score
        participant.score += 1;

        // Mark the scores array as modified
        quizSession.markModified('scores');

        // Save the updated quiz session
        const response = await quizSession.save();

        return response;
      } else {
        this.logger.error(`Participant with userId: ${userId} not found`);
        throw new Error(`Participant not found in quiz session`);
      }
    }

    // If the answer is incorrect, return the quiz session without changes
    this.logger.log('Answer was incorrect, no updates made.');
    return quizSession;
  }

  //  Calculate the winner based on scores
  private calculateWinner(scores: Score[]): string | null {
    let maxScore = 0;
    let winner = null;

    for (const { userId, score } of scores) {
      if (score > maxScore) {
        maxScore = score;
        winner = userId;
      }
    }

    return winner;
  }
}
