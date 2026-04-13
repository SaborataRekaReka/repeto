import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const r = exResponse as Record<string, unknown>;
        message = (r.message as string) || message;
        details = r.details || (Array.isArray(r.message) ? r.message : undefined);
        if (details) {
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : exception.message;
    } else {
      this.logger.error('Unknown exception', exception);
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status]?.replace(/_/g, ' ') || 'Error',
      message,
      ...(details ? { details } : {}),
    });
  }
}
