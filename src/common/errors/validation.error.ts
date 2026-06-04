import { AppError } from './app.error';

export class ValidationError extends AppError {
  statusCode = 400;

  constructor(message = 'Validation error') {
    super(message);
  }
}
