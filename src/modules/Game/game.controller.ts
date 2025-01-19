import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from '../../guards/auth.guard';
import { ExtendedRequest } from 'src/types/global';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  @UseGuards(AuthGuard)
  async startGame(@Req() req: ExtendedRequest) {
    const userId = req.user.userId;

    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Validate that the user is currently not occupied
    const isValid = await this.gameService.validateUser(userId);

    if (!isValid) {
      throw new HttpException(
        'User is already in a game',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Match the user with a suitable participant
    const matchedParticipant = await this.gameService.matchParticipant(userId);

    if (!matchedParticipant) {
      throw new HttpException(
        'No suitable participants found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Select questions and create a game session
    const quizSession = await this.gameService.createQuizSession(
      userId,
      matchedParticipant,
    );

    // Notify both players of game start via WebSocket
    this.gameService.startQuizSession(quizSession);

    return {
      message: 'Game started successfully',
      quizSessionId: quizSession._id,
    };
  }
}
