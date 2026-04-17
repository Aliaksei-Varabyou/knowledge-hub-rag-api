import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ArticleStatus } from 'generated/prisma/client';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsNotEmpty()
  @IsString()
  content: string;
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
  @IsOptional()
  @IsString()
  authorId?: string;
  @IsOptional()
  @IsString()
  categoryId?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
