# ============================================================================
# NeuroCare Platform - Backend Dockerfile (Multi-Stage Build)
# ============================================================================

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ && \
    rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Enable pnpm (this repo is a pnpm workspace)
RUN corepack enable

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* .npmrc* ./
# Install dependencies (including devDependencies for Prisma CLI)
RUN pnpm install --frozen-lockfile --ignore-scripts=false && \
    pnpm store prune
# Copy Prisma schema
COPY prisma ./prisma
# Generate Prisma client
RUN pnpm exec prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN pnpm run build

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for healthcheck
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:4000/api/v1/health || exit 1

# Apply pending database migrations, then start the server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node dist/server.js"]