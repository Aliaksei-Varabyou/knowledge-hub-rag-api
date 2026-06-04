import { IsEnum, IsString, IsArray, IsOptional } from 'class-validator';
import { ArticleStatus } from 'src/common/types';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  content?: string;
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
