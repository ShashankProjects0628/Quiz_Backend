import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/jwt.util';
import { ErrorMessages } from '../../utils/error.util';
import { UserRepository } from 'src/database/repositories/user.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  // Service function to register a new user
  async register(registerDto: RegisterDto) {
    const { email, firstName, lastName, password, city, state, country } =
      registerDto;

    // Check if the email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException(ErrorMessages.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = await this.userRepository.createUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      city,
      state,
      country,
    });

    // Generate tokens
    const refreshToken = generateRefreshToken(
      { userId: user._id },
      process.env.JWT_SECRET as string,
    );
    const accessToken = generateAccessToken(
      { userId: user._id, firstName },
      process.env.JWT_SECRET as string,
    );

    // Store the refresh token in Redis
    await this.redisService.set(
      `refreshToken:${user._id}`,
      refreshToken,
      7 * 24 * 60 * 60,
    );

    return { accessToken, refreshToken };
  }

  // Service function to login a user
  async login(email: string, password: string) {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const refreshToken = generateRefreshToken(
      { userId: user._id },
      process.env.JWT_SECRET as string,
    );
    const accessToken = generateAccessToken(
      {
        userId: user._id,
        firstName: user.firstName,
      },
      process.env.JWT_SECRET as string,
    );

    return { accessToken, refreshToken };
  }

  async regenerateTokenIfExpired(userId: string, refreshToken: string) {
    // Check user refresh token from redis
    const storedRefreshToken = await this.redisService.get(
      `refreshToken:${userId}`,
    );
    if (!storedRefreshToken) {
      const userDetails = await this.userRepository.findById(userId);
      if (!userDetails) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      await this.redisService.set(
        `refreshToken:${userId}`,
        refreshToken,
        7 * 24 * 60 * 60,
      );
    }

    if (refreshToken !== storedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return generateAccessToken(
      { id: userId },
      process.env.JWT_SECRET as string,
    );
  }
}
