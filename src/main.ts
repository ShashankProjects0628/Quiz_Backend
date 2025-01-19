import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketService } from './socket/socket.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set up CORS
  app.enableCors({
    origin: '*', // Replace with allowed origins in production
  });

  // Start the HTTP server
  const server = await app.listen(3001);

  // Initialize Socket.IO with the HTTP server
  const socketService = app.get(SocketService);
  socketService.initialize(server);

  console.log(`Application is running on: http://localhost:3001`);
}
bootstrap();
