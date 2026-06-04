import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtGuard } from './auth/jwt/jwt.guard';
import { RolesGuard } from './auth/roles/roles.guard';
import { AppLogger } from './common/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function shutdown(app: any, logger: any, reason: string, error?: any) {
  logger.error(
    {
      reason,
      error: error?.message,
      stack: error?.stack,
    },
    'ProcessHandler',
  );

  try {
    await app.close();
    logger.log('App closed gracefully', 'ProcessHandler');
  } catch (e) {
    logger.error('Error during shutdown', e?.stack, 'ProcessHandler');
  } finally {
    process.exit(1);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new AppLogger();
  app.useLogger(logger);

  app.useGlobalFilters(new GlobalExceptionFilter(app.get(AppLogger)));

  process.on('uncaughtException', async (error) => {
    await shutdown(app, logger, 'uncaughtException', error);
  });
  process.on('unhandledRejection', async (reason: any) => {
    await shutdown(app, logger, 'unhandledRejection', reason);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // delete fields not described in DTO
      forbidNonWhitelisted: true, // error if we have not described fields
      transform: true, // auto transform data types
    }),
  );

  app.useGlobalGuards(app.get(JwtGuard), app.get(RolesGuard));

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('Documentation REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  await app.listen(PORT);
}
bootstrap();
