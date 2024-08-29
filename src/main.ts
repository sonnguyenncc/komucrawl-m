import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotGateway } from './bot/events/bot.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bot = app.get(BotGateway);
  bot.initEvent();

  await app.listen(8000);
}
bootstrap();
