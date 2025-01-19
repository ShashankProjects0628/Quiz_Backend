import { forwardRef, Global, Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { GameModule } from 'src/modules/Game/game.module';

@Global()
@Module({
  imports: [forwardRef(() => GameModule)],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}
