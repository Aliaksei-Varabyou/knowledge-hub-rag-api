import { validate } from 'class-validator';
import { CreateArticleDto } from '../create-article.dto';
import { UpdateArticleDto } from '../update-article.dto';

describe('CreateArticleDto', () => {
  it('Should fail if required fields is missing', async () => {
    const dto = new CreateArticleDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
  it('Should fail with incorrect tags', async () => {
    const dto = new CreateArticleDto();
    dto.title = 'test Title';
    dto.content = 'some content for article';
    dto.tags = 'tags' as any;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'tags')).toBe(true);
  });
  it('Should fail with incorrect status', async () => {
    const dto = new CreateArticleDto();
    dto.title = 'test Title';
    dto.content = 'some content for article';
    dto.status = 'status' as any;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
  it('Should pass with valid data', async () => {
    const dto = new CreateArticleDto();
    dto.title = 'test Title';
    dto.content = 'some content for article';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('UpdateArticleDto', () => {
  it('should pass with empty object', async () => {
    const dto = new UpdateArticleDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  it('should fail with invalid status', async () => {
    const dto = new UpdateArticleDto();
    dto.status = 'status' as any;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
  it('should fail if tags is not an array', async () => {
    const dto = new UpdateArticleDto();
    dto.tags = 'not-array' as any;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'tags')).toBe(true);
  });
});
