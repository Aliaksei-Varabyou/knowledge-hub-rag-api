import { Injectable, NotFoundException } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import { GeminiService } from 'src/ai/gemini/gemini.service';
import { ArticleService } from 'src/article/article.service';
import { ChunkingService } from './chunking.service';
import { QdrantService } from './qdrant.service';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ArticleStatus } from 'src/common/types';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';

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
              categoryId: article.categoryId,
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

  async deleteArticleVectors(articleId: string) {
    const client = this.qdrantService.getClient();
    const collectionName = this.qdrantService.getCollectionName();

    const existing = await client.scroll(collectionName, {
      filter: {
        must: [
          {
            key: 'articleId',
            match: {
              value: articleId,
            },
          },
        ],
      },
      limit: 1,
    });
    if (!existing.points.length) {
      throw new NotFoundException('Article vectors not found');
    }

    await client.delete(collectionName, {
      filter: {
        must: [
          {
            key: 'articleId',
            match: {
              value: articleId,
            },
          },
        ],
      },
      wait: true,
    });
  }

  private buildSearchFilter(dto: RagSearchRequestDto) {
    const must: any[] = [];

    if (dto.articleStatus) {
      must.push({
        key: 'status',
        match: {
          value: dto.articleStatus,
        },
      });
    }
    if (dto.categoryId) {
      must.push({
        key: 'categoryId',
        match: {
          value: dto.categoryId,
        },
      });
    }
    if (dto.tags?.length) {
      must.push(
        ...dto.tags.map((tag) => ({
          key: 'tags',
          match: {
            value: tag,
          },
        })),
      );
    }

    return must.length ? { must } : undefined;
  }

  async search(dto: RagSearchRequestDto) {
    const client = this.qdrantService.getClient();
    const collectionName = this.qdrantService.getCollectionName();
    const embedding = await this.geminiService.generateEmbeddings(dto.query);

    const searchResult = await client.search(collectionName, {
      vector: embedding,
      limit: dto.limit ?? 5,
      filter: this.buildSearchFilter(dto),
    });

    return {
      results: searchResult.map((point) => ({
        articleId: point.payload?.articleId,
        articleTitle: point.payload?.articleTitle,
        chunk: point.payload?.chunk,
        similarity: point.score,
      })),
    };
  }
}
