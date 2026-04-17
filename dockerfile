# Stage 1
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/ 
COPY prisma.config.ts /app/prisma.config.ts

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN npx prisma generate

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
