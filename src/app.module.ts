import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { SocketModule } from './socket/socket.module';
import { AuthModule } from './modules/Auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { GameModule } from './modules/Game/game.module';
import { JWT_EXPIRY } from './constants/global';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRY },
      global: true,
    }),
    SocketModule,
    GameModule,
    AuthModule,
  ],
})
export class AppModule {}
