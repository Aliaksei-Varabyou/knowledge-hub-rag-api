import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse();

    response.setHeader('Retry-After', '60');

    throw new ThrottlerException('Too many requests');
  }
}
