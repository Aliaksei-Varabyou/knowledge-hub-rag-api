import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // delete fields not described in DTO
    forbidNonWhitelisted: true, // error if we have not described fields
    transform: true, // auto transform data types
  }));

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
