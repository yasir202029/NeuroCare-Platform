# syntax=docker.io/docker/dockerfile:1
# Backend multi-stage Docker build
FROM node:24-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json* backend/pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/root/.npm npm ci 2>/dev/null || npm ci --omit=dev 2>/dev/null || true
COPY backend/ ./
RUN npx prisma generate 2>/dev/null || true
RUN npm run build 2>/dev/null || npx tsc -p tsconfig.json

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY backend/.env.example .env
EXPOSE 4000
CMD ["node", "dist/server.js"]
