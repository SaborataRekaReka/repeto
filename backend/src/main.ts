import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = new Logger('Bootstrap');

// Prevent unhandled errors from crashing the process
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason instanceof Error ? reason.stack : reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error.stack);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  // Global exception filter — catches all unhandled errors in controllers
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  const allowedOrigins = (
    process.env.FRONTEND_URL || 'http://localhost:3100'
  )
    .split(',')
    .concat('http://localhost:3300');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Repeto API')
    .setDescription('РепетиторЖурнал — CRM для частных репетиторов')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3200;
  await app.listen(port);
  console.log(`🚀 Repeto API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap().catch((err) => {
  logger.error('Failed to start Repeto API', err.stack || err);
  process.exit(1);
});
