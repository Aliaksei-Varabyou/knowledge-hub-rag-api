import { Injectable, LoggerService } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class AppLogger implements LoggerService {
  private level: LogLevel;
  private levels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'log';
  }

  log(message: any, context?: string) {
    this.print('log', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.print('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.print('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.print('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.print('verbose', message, context);
  }

  private shouldLog(level: LogLevel): boolean {
    const currIndex = this.levels.indexOf(this.level);
    const messageIndex = this.levels.indexOf(level);
    return messageIndex <= currIndex;
  }

  private print(
    level: LogLevel,
    message: any,
    context?: string,
    trace?: string,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();

    if (isProd) {
      // JSON format
      JSON.stringify({
        level,
        message,
        timestamp,
        context,
        trace,
      });
    } else {
      // user friendly
      const ctx = context ? `[${context}]` : '';
      console.log(`${timestamp} ${level.toUpperCase()} ${ctx} ${message}`);
      if (trace) {
        console.log(trace);
      }
    }
  }
}
