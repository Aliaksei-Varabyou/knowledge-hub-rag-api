import { IsEnum, IsOptional } from 'class-validator';

export enum AnalyzeTask {
  REVIEW = 'review',
  BUGS = 'bugs',
  OPTIMIZE = 'optimize',
  EXPLAIN = 'explain',
}

export class AnalyzeArticleDto {
  @IsOptional()
  @IsEnum(AnalyzeTask)
  task?: AnalyzeTask;
}
