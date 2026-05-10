import { Injectable } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import { GeminiService } from 'src/ai/gemini/gemini.service';
import { ArticleService } from 'src/article/article.service';
import { ChunkingService } from './chunking.service';
import { QdrantService } from './qdrant.service';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ArticleStatus } from 'src/common/types';

const RAG_POINT_NAMESPACE = '4e48c97b-1d3d-4f0a-9c32-35b12a9e7a6b';

@Injectable()
export class RagService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
    private readonly chunkingService: ChunkingService,
    private readonly qdrantService: QdrantService,
  ) {}

  private async getArticlesForIndexing(dto: ReindexRequestDto) {
    if (dto.articleIds?.length) {
      return this.articleService.findManyByIds(dto.articleIds);
    }

    const result = await this.articleService.findAll({
      status: dto.onlyPublished ? ArticleStatus.PUBLISHED : undefined,
    });

    return result.data;
  }

  async indexArticles(dto: ReindexRequestDto) {
    const articles = await this.getArticlesForIndexing(dto);
    const client = this.qdrantService.getClient();
    const collectionName = this.qdrantService.getCollectionName();

    let indexedChunks = 0;

    for (const article of articles) {
      const chunks = this.chunkingService.chunkText(article.content);

      const points = await Promise.all(
        chunks.map(async (chunk, index) => {
          const embedding = await this.geminiService.generateEmbeddings(chunk);

          indexedChunks++;

          return {
            id: crypto.randomUUID(),

            vector: embedding,

            payload: {
              articleId: article.id,
              articleTitle: article.title,
              chunk,
              chunkIndex: index,
              status: article.status,
              updatedAt: article.updatedAt,
            },
          };
        }),
      );

      await client.upsert(collectionName, {
        wait: true,
        points,
      });
    }

    return {
      indexedArticles: articles.length,
      indexedChunks,
      vectorCollection: collectionName,
    };
  }
}
