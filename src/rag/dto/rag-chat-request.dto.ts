import { IsOptional, IsString } from 'class-validator';

export class RagChatRequestDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
