import { BadRequestException, PipeTransform } from '@nestjs/common';
import { validate as isUuid } from 'uuid';

export class ParseUUIDPipe implements PipeTransform {
  transform(value: string) {
    if (!isUuid(value)) {
      throw new BadRequestException('Invalid UUID');
    }
    return value;
  }
}
