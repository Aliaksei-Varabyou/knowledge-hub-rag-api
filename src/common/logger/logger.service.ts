import * as fs from 'fs';
import * as path from 'path';
import { Injectable, LoggerService } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class AppLogger implements LoggerService {
  private level: LogLevel;
  private levels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  private logDir = path.join(process.cwd(), 'logs');
  private logFile = path.join(this.logDir, 'app.log');
  private maxFileSizeKB = Number(process.env.LOG_MAX_FILE_SIZE) || 1024;

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

    const logLine = isProd
      ? JSON.stringify({
          level,
          message,
          context,
          timestamp,
          trace,
        })
      : `${timestamp} ${level.toUpperCase()} ${context || ''} ${message}`;

    this.writeToFile(logLine);
  }

  private ensureFileDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
  }

  private rotateIfNeeded() {
    if (!fs.existsSync(this.logFile)) return;
    const stats = fs.statSync(this.logFile);
    const sizeKb = stats.size / 1024;
    if (sizeKb < this.maxFileSizeKB) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newName = path.join(this.logDir, `app-${timestamp}`);
    fs.renameSync(this.logFile, newName);
  }

  private writeToFile(log: string) {
    this.ensureFileDir()
    this.rotateIfNeeded();
    fs.appendFileSync(this.logFile, log + '\n');
  }
}
