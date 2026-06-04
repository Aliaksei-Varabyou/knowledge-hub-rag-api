import { BadRequestException } from '@nestjs/common';
import { ParseUUIDPipe } from '../parse-uuid.pipe';

describe('ParseUUIDPipe', () => {
  const pipe = new ParseUUIDPipe();

  it('Should pass with valid UUID', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = pipe.transform(validUuid);
    expect(result).toBe(validUuid);
  });
  it('Should fail with wrong UUID', () => {
    const uuid = 'not-valid-uuid';
    expect(() => pipe.transform(uuid)).toThrow(
      new BadRequestException('Invalid UUID'),
    );
  });
});
