# ============================================================================
# NeuroCare Platform - Frontend Dockerfile (Multi-Stage Build)
# ============================================================================

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Install build dependencies
RUN apk add --no-cache python3 make g++ libc6-compat && \
    rm -rf /var/cache/apk/*

# Enable pnpm (this repo is a pnpm workspace)
RUN corepack enable

# Copy application code (needed for workspace manifests)
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Install ALL dependencies (devDependencies required for `next build`)
RUN pnpm install --frozen-lockfile --ignore-scripts=false && \
    pnpm store prune

# Copy application code
COPY . .

# Build Next.js application
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN pnpm run build

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Install curl for healthcheck
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["pnpm", "run", "start"]
