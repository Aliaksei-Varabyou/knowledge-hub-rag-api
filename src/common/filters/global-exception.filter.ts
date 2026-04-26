import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppLogger } from '../logger/logger.service';
import { AppError } from '../errors/app.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: AppLogger) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';

    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
    }

    this.logger.error(
      {
        message: exception.message,
        stack: exception.stack,
        method: request.method,
        url: request.url,
      },
      'GlobalExceptionFilter',
    );

    response.status(statusCode).json({
      statusCode,
      error:
        statusCode === 500
          ? 'Internal Server Error'
          : exception.name || 'Error',
      message,
    });
  }
}
