# Knowledge Hub

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.
- Docker Desktop or Docker Engine with Docker Compose - [Download & Install Docker](https://docs.docker.com/get-docker/).

## Downloading

```
git clone {repository URL}
```

## Installing NPM modules

Install local dependencies if you want to run development commands such as tests, linting, or `npm start`:

```
npm install
```

## Running application

The recommended startup path is Docker Compose, because the application requires PostgreSQL and Qdrant:

```
cp .env.example .env
docker compose up -d --build
```

Set `GEMINI_API_KEY` in `.env` before using AI and RAG endpoints.

After starting the app on port `4000` you can open OpenAPI documentation in your browser:
http://localhost:4000/doc/.
For more information about OpenAPI/Swagger please visit https://swagger.io/.

For local development without Docker, make sure PostgreSQL and Qdrant are running and `.env` points to reachable services, then run:

```
npm start
```

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging

## Docker Image

The application image is available on Docker Hub:

https://hub.docker.com/r/aliakseivarabyou/knowledge-hub

You can pull and run it using:

docker pull aliakseivarabyou/knowledge-hub:latest

## AI and RAG Integration

This project includes AI-powered article features and RAG search/chat built on Google Gemini and Qdrant.

### Gemini API Key

1. Open https://aistudio.google.com/app/apikey.
2. Sign in with a Google account.
3. Click **Create API key**.
4. Select an existing Google Cloud project or create a new one.
5. Copy the generated key.
6. Make sure the Generative Language API is enabled for the selected project in Google Cloud Console: https://console.cloud.google.com/.

### Gemini Models

- Generation model: `gemini-2.0-flash`
- Embedding model: `gemini-embedding-001`
- API base URL: `https://generativelanguage.googleapis.com`
- Integration: HTTP via NestJS `HttpService`

### Vector Database

RAG uses Qdrant as an external vector database.

Qdrant runs as a separate Docker Compose service named `vectordb`:

```bash
docker compose up -d vectordb
```

The full application stack starts Qdrant, PostgreSQL, and the NestJS app:

```bash
docker compose up -d --build
```

Qdrant is exposed on `http://localhost:6333` and the app connects to it internally through `http://vectordb:6333`.

### Environment Setup

Create `.env` from `.env.example` and set at least `GEMINI_API_KEY`:

```bash
cp .env.example .env
```

Required RAG and Gemini variables:

```env
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

AI cache and rate limit variables:

```env
AI_RATE_LIMIT_RPM=20
AI_CACHE_TTL_SEC=300
```

### Startup Flow After Clone

1. Install dependencies for local development:

```bash
npm install
```

2. Prepare `.env`:

```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`.

4. Start the full stack:

```bash
docker compose up -d --build
```

5. Check services:

```bash
docker compose ps
```

The app should be available at `http://localhost:4000`, Swagger at `http://localhost:4000/doc/`, and Qdrant at `http://localhost:6333`.

6. Build the RAG index:

```bash
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Content-Type: application/json" \
  -d '{"onlyPublished":true}'
```

To index selected articles only:

```bash
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Content-Type: application/json" \
  -d '{"articleIds":["article-id-1","article-id-2"]}'
```

### Sample RAG Requests

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

Continue a chat conversation by passing the returned `conversationId`:

```bash
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"returned-conversation-id","question":"Can you explain that in more detail?"}'
```

Remove vectors for one article:

```bash
curl -X DELETE http://localhost:4000/ai/rag/index/articles/article-id
```

---

### AI Endpoints

#### Summarize Article

POST /ai/articles/:articleId/summarize

Request:
{
"maxLength": "short" | "medium" | "detailed"
}

Response:
{
"articleId": "string",
"summary": "string",
"originalLength": number,
"summaryLength": number
}

---

#### Translate Article

POST /ai/articles/:articleId/translate

Request:
{
"targetLanguage": "string",
"sourceLanguage": "string (optional)"
}

Response:
{
"articleId": "string",
"translatedText": "string",
"detectedLanguage": "string"
}

---

#### Analyze Article

POST /ai/articles/:articleId/analyze

Request:
{
"task": "review" | "bugs" | "optimize" | "explain"
}

Response:
{
"articleId": "string",
"analysis": "string",
"suggestions": ["string"],
"severity": "info" | "warning" | "error"
}

---

#### AI Usage Stats

GET /ai/usage

Response:
{
"totalRequests": number,
"byEndpoint": {
"summarize": number,
"translate": number,
"analyze": number
}
}

---

### Caching

- Applied to summarize and translate endpoints
- In-memory storage
- Cache key includes:
  - articleId
  - updatedAt
  - request parameters
- TTL configurable via AI_CACHE_TTL_SEC

---

### Rate Limiting

- Default: 20 requests per minute
- Configurable via AI_RATE_LIMIT_RPM
- Returns:
  - 429 Too Many Requests
  - Retry-After header

---

### Usage Tracking

Tracks AI usage in memory:

- total requests
- requests per endpoint

Note: data resets on server restart

---

### Security

- API keys stored in environment variables
- No sensitive data is logged
- Input validation via DTO + ValidationPipe

---

### Limitations

- Uses in-memory cache (not persistent)
- Gemini free-tier API keys have request quotas and rate limits; RAG indexing may fail with `503` if the quota is exceeded.
- Gemini and Qdrant calls add network latency to search, chat, and indexing requests.
- Indexing time grows with the number and size of articles because each chunk requires an embedding request.
- Gemini model availability may depend on API version, account access, and region; use `GEMINI_EMBEDDING_MODEL=gemini-embedding-001` unless another available embedding model is verified.
- Large articles are split into chunks, but generation prompts may still be constrained by model context limits.
- Qdrant data is stored in a Docker volume; removing volumes deletes the vector index.
- Usage tracking resets on restart
