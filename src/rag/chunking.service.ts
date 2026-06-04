import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ChunkingService {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(private readonly config: ConfigService) {
    this.chunkSize = this.config.get<number>('RAG_CHUNK_SIZE', 800);
    this.chunkOverlap = this.config.get<number>('RAG_CHUNK_OVERLAP', 200);
  }

  chunkText(text: string): string[] {
    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE');
    }

    const normalized: string = text.trim();

    const chunks: string[] = [];
    let start: number = 0;
    while (start < normalized.length) {
      const end = start + this.chunkSize;
      chunks.push(normalized.slice(start, end));
      start += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }
}
