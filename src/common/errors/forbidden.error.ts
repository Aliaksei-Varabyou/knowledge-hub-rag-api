import { AppError } from './app.error';

export class ForbiddenError extends AppError {
  statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
  }
}
