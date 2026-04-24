import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = new Logger('Bootstrap');

const isProduction = process.env.NODE_ENV === 'production';

// Initialize Sentry in production
if (isProduction && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.2,
  });
  logger.log('Sentry initialized');
}

// Prevent unhandled errors from crashing the process
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason instanceof Error ? reason.stack : reason);
  if (reason instanceof Error) Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error.stack);
  Sentry.captureException(error);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  if (isProduction) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Global exception filter — catches all unhandled errors in controllers
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction && allowedOrigins.length === 0) {
    throw new Error('FRONTEND_URL must be configured in production');
  }

  if (!isProduction) {
    allowedOrigins.push('http://localhost:3300');
    allowedOrigins.push('http://127.0.0.1:3100');
    allowedOrigins.push('http://127.0.0.1:3300');
  }

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

  // Swagger — disabled in production
  const swaggerEnabled = !isProduction;
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Repeto API')
      .setDescription('РепетиторЖурнал — CRM для частных репетиторов')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3200;
  await app.listen(port);
  logger.log(`Repeto API running on http://localhost:${port}`);
  if (swaggerEnabled) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}
bootstrap().catch((err) => {
  logger.error('Failed to start Repeto API', err.stack || err);
  process.exit(1);
});
