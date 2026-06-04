import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
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
    let error = 'Internal Server Error';

    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = exception.name || 'Error';
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        error = exception.name || 'HttpException';
      } else {
        const payload = response as Record<string, unknown>;
        const responseMessage = payload.message;

        if (Array.isArray(responseMessage)) {
          message = responseMessage.join(', ');
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else {
          message = exception.message;
        }

        error =
          typeof payload.error === 'string'
            ? payload.error
            : exception.name || 'HttpException';
      }
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
      error,
      message,
    });
  }
}
