import { Injectable, NestMiddleware } from '@nestjs/common';
import { AppLogger } from '../logger/logger.service';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, body, query } = req;

    this.logger.log(`Incoming Request: ${method}: ${originalUrl}`, 'HTTP');

    this.logger.debug(
      JSON.stringify({
        query,
        body: this.sanitize(body),
      }),
      'HTTP',
    );

    res.on('finish', () => {
      const duration = Date.now() - start;

      this.logger.log(
        `Response: ${method} ${originalUrl} ${res.statusCode} - ${duration}ms`,
        'HTTP',
      );
    });
    next();
  }

  private sanitize(body: any) {
    if (!body) return;
    const clone = { ...body };

    if (clone.password) {
      clone.password = '[REDACTED]';
    }
    if (clone.token) {
      clone.token = '[REDACTED]';
    }
    if (clone.refreshToken) {
      clone.refreshToken = '[REDACTED]';
    }

    return clone;
  }
}
