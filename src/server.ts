/* eslint-disable no-console */
import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config/index';
import { RedisClient } from './shared/redis';
import subscribeToEvents from './app/modules/events';

process.on('uncaughtException', error => {
  console.error(error);
  process.exit(1);
});

let server: Server;

async function bootstrap() {
  try {
    await RedisClient.connect().then(() => {
      subscribeToEvents()
    });
    await mongoose.connect(config.database_url as string);
    console.info(`🛢   Database is connected successfully`);

    server = app.listen(config.port, () => {
      console.info(`Application  listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to connect database', err);
  }

  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        console.error(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

bootstrap();

process.on('SIGTERM', () => {
  console.info('SIGTERM is received');
  if (server) {
    server.close();
  }
});