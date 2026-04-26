import { AppError } from './app.error';

export class NotFoundError extends AppError {
  statusCode = 404;

  constructor(message = 'Resource not found') {
    super(message);
  }
}
