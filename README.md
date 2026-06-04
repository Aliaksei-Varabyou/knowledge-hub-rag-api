# Knowledge Hub API

Knowledge Hub API is a NestJS backend for managing technical articles, categories, comments, users, and AI-assisted knowledge retrieval. It combines a PostgreSQL-backed content API with Gemini-powered article analysis and Qdrant-based retrieval-augmented generation (RAG).

The service is designed to run as a Docker Compose stack with PostgreSQL, Qdrant, and the application container.

## Capabilities

- Article, category, comment, and user management
- JWT-based authentication and role-based access control
- Gemini-powered article summarization, translation, and analysis
- RAG indexing for Knowledge Hub articles
- Semantic search over indexed article chunks
- Grounded RAG chat with source attribution and conversation memory
- Qdrant vector storage with Docker Compose integration
- Swagger/OpenAPI documentation at `/doc`

## Tech Stack

- Runtime: Node.js 22+
- Framework: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Vector database: Qdrant
- AI provider: Google Gemini API
- Container runtime: Docker Compose

## Architecture Overview

```text
Client
  |
  v
NestJS API
  |-- PostgreSQL / Prisma: users, articles, categories, comments
  |-- Gemini API: generation and embeddings
  |-- Qdrant: vector index for article chunks
```

RAG flow:

1. Articles are loaded from PostgreSQL.
2. Article content is split into configurable chunks.
3. Gemini embeddings are generated for each chunk.
4. Vectors and metadata are stored in Qdrant.
5. Search and chat requests embed the user query and retrieve relevant chunks.
6. RAG chat builds a grounded prompt and returns an answer with sources.

## Prerequisites

- Git
- Node.js 22+
- npm
- Docker Desktop or Docker Engine with Docker Compose
- Gemini API key

## Gemini API Key

1. Open https://aistudio.google.com/app/apikey.
2. Sign in with a Google account.
3. Click **Create API key**.
4. Select an existing Google Cloud project or create a new one.
5. Copy the generated key.
6. Make sure the Generative Language API is enabled for the selected project in Google Cloud Console: https://console.cloud.google.com/.

## Models

Default Gemini configuration:

- Generation model: `gemini-2.0-flash`
- Embedding model: `gemini-embedding-001`
- API base URL: `https://generativelanguage.googleapis.com`

The embedding model must support the `embedContent` method for the configured API version.

## Environment

Create a local environment file:

```bash
cp .env.example .env
```

Set `GEMINI_API_KEY` in `.env`.

Core variables:

```env
PORT=4000

DATABASE_URL=postgresql://postgres:postgres@db:5432/knowledge_hub?schema=public

GEMINI_API_KEY=your_api_key_here
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

RAG_VECTOR_DB_PROVIDER=qdrant
RAG_VECTOR_DB_URL=http://vectordb:6333
RAG_VECTOR_COLLECTION=knowledge_hub_articles

RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=200
RAG_CONVERSATION_MAX_MESSAGES=20
```

The Docker Compose setup uses service DNS names, so `DATABASE_URL` points to `db` and `RAG_VECTOR_DB_URL` points to `vectordb`.

## Running With Docker Compose

Start the full stack:

```bash
docker compose up -d --build
```

Check service health:

```bash
docker compose ps
```

Open API documentation:

```text
http://localhost:4000/doc/
```

Qdrant is exposed locally at:

```text
http://localhost:6333
```

The application container runs database migrations on startup and can seed initial data when `RUN_SEED=true`.

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run the app locally:

```bash
npm start
```

For local execution outside Docker, make sure PostgreSQL and Qdrant are running and update `.env` to point to locally reachable hosts, for example `localhost` instead of Docker service names.

## RAG Indexing

Build an index for published articles:

```bash
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Content-Type: application/json" \
  -d '{"onlyPublished":true}'
```

Index selected articles:

```bash
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Content-Type: application/json" \
  -d '{"articleIds":["article-id-1","article-id-2"]}'
```

Remove vectors for one article:

```bash
curl -X DELETE http://localhost:4000/ai/rag/index/articles/article-id
```

## RAG Search And Chat

Semantic search:

```bash
curl -X POST http://localhost:4000/ai/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"How does Docker help backend development?","limit":5}'
```

Search with metadata filters:

```bash
curl -X POST http://localhost:4000/ai/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"NestJS architecture","articleStatus":"PUBLISHED","tags":["nestjs"],"limit":5}'
```

RAG chat:

```bash
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What does Knowledge Hub say about NestJS?"}'
```

Continue a conversation:

```bash
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"returned-conversation-id","question":"Can you explain that in more detail?"}'
```

## AI Article Endpoints

Summarize an article:

```http
POST /ai/articles/:articleId/summarize
```

Translate an article:

```http
POST /ai/articles/:articleId/translate
```

Analyze an article:

```http
POST /ai/articles/:articleId/analyze
```

Read AI usage counters:

```http
GET /ai/usage
```

## Authentication

The API uses JWT access and refresh tokens.

Sign up:

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"login":"viewer","password":"viewer123"}'
```

Log in:

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'
```

Seeded users:

- `admin / admin123`
- `editor / editor123`

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

## Testing And Quality Checks

Run TypeScript build:

```bash
npm run build
```

Run unit tests:

```bash
npm run test:unit
```

Run e2e tests:

```bash
npm run test
```

Run formatting:

```bash
npm run format
```

Run ESLint with autofix:

```bash
npm run lint
```

## Operational Notes

- Gemini free-tier API keys have quotas and rate limits.
- RAG indexing can take time because each chunk requires an embedding request.
- Gemini and Qdrant calls add network latency to search, chat, and indexing.
- Gemini model availability may depend on API version, account access, and region.
- Qdrant data is stored in a Docker volume; removing volumes deletes the vector index.
- In-memory cache and usage counters reset on application restart.
- In-memory RAG conversation history resets on application restart.

## Docker Image

The application image can be built locally:

```bash
docker compose build app
```

The Compose stack defines three runtime services:

- `app`: NestJS API
- `db`: PostgreSQL
- `vectordb`: Qdrant
