import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { REDIS_KEYS } from 'src/constants/redis';
import { SOCKET_EVENTS } from 'src/constants/socket';
import { GameService } from 'src/modules/Game/game.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}
  private io: Server;

  // Initialize the Socket.IO server
  initialize(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // TODO: Will be replaced with the frontend URL
        methods: ['GET', 'POST'],
      },
    });

    // Socket Middleware to verify the JWT token
    this.io.use(async (socket, next) => {
      const socketToken =
        socket.handshake.headers['authorization'] ||
        socket.handshake.auth.token;

      // Extract the token from the 'Authorization' header
      const token = socketToken.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        socket.handshake.auth.userId = payload.userId;
        socket.handshake.auth.firstName = payload.firstName;
        next();
      } catch (err: any) {
        this.logger.error('Error verifying token:', err);
        return next(new Error('User ID not provided'));
      }
    });

    // Registering event listeners
    this.io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
      this.logger.log(`Client connected: ${socket.id}`);

      // Register socket in the redis
      await this.redisService.setRecordsInSortedSets(REDIS_KEYS.ACTIVE_USERS, [
        { score: Date.now(), value: socket.handshake.auth.userId },
      ]);

      // Join the user's specific socket room
      socket.join(`quiz:${socket.handshake.auth.userId}`);

      // Listen for disconnect event
      socket.on(SOCKET_EVENTS.DISCONNECT, async (reason) => {
        await this.redisService.deleteRecordFromSortedSets(
          REDIS_KEYS.ACTIVE_USERS,
          socket.handshake.auth.userId,
        );
        this.logger.log(`Client disconnected: ${socket.id}. Reason: ${reason}`);
      });

      // Listen for error events
      socket.on(SOCKET_EVENTS.ERROR, (error) => {
        this.logger.error(`Socket error: ${error}`);
      });

      // Listen for answer submission
      socket.on(SOCKET_EVENTS.ANSWER_SUBMIT, async (data) => {
        // Handle answer submission here
        await this.gameService.submitAnswer(
          data.quizId,
          socket.handshake.auth.userId,
          data.questionId,
          data.answer,
        );

        socket.emit(SOCKET_EVENTS.ANSWER_SUBMIT, data);
      });
    });

    this.logger.log('Socket.IO server initialized');
  }

  // Join the user specific socket with the quiz room
  joinRoom(room: string, userId: string) {
    const socket = this.getUserSocket(userId);
    if (socket) {
      socket.join(room);
      this.logger.log(`User ${userId} joined room ${room}`);
    }
  }

  // Get the user socket from the userId
  getUserSocket(userId: string) {
    const sockets = this.io.sockets.sockets;
    for (const [_id, socket] of sockets) {
      this.logger.log(_id);
      if (socket.handshake.auth.userId === userId) {
        return socket;
      }
    }
    return null;
  }

  // Emit an event to a specific room
  emitEvent(eventName: string, data: any, roomId: string = '/') {
    if (!this.io) {
      this.logger.error('Socket.IO server is not initialized');
      throw new Error('Socket.IO server is not initialized');
    }

    try {
      this.io.to(roomId).emit(eventName, data);
      this.logger.log(
        `Event emitted: ${eventName} with data: ${JSON.stringify(data)}`,
      );
    } catch (error) {
      this.logger.error(`Error emitting event: ${eventName}`, error.stack);
    }
  }

  onModuleInit() {
    this.logger.log('SocketService initialized');
  }

  onModuleDestroy() {
    if (this.io) {
      this.io.close(() => {
        this.logger.log('Socket.IO server closed');
      });
    }
  }
}
