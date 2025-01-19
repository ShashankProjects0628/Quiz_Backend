import { forwardRef, Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [forwardRef(() => SocketModule)],
  providers: [GameService],
  controllers: [GameController],
  exports: [GameService],
})
export class GameModule {}
