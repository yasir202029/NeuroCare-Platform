# ============================================================================
# NeuroCare Platform - Frontend Dockerfile (pnpm workspace, root context)
# Build from repo root: docker build -f apps/neurocare-platform/Dockerfile .
# ============================================================================

# Stage 0: workspace prereqs (lockfile + catalog deps needed by the app)
FROM node:24-alpine AS prereqs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENV PATH=/usr/local/lib/node_modules/corepack/shims:$PATH

RUN corepack prepare pnpm@latest --activate && corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps/neurocare-platform/package.json ./apps/neurocare-platform/package.json
# Workspace packages the app depends on must be present for the lockfile to
# resolve, and their sources are needed again at build time.
COPY packages ./packages
RUN pnpm install --frozen-lockfile --ignore-scripts=false && \
    pnpm store prune

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENV PATH=/usr/local/lib/node_modules/corepack/shims:$PATH

COPY --from=prereqs /app /app
COPY apps/neurocare-platform ./apps/neurocare-platform
COPY packages ./packages

WORKDIR /app/apps/neurocare-platform

# Build Next.js application
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
# Server-side only: the address the Next server proxies /api/* to. Inside
# Docker this is the backend service name, not localhost.
ARG API_INTERNAL_URL=http://backend:4000
ENV API_INTERNAL_URL=$API_INTERNAL_URL

RUN pnpm run build && \
    cd /app && \
    pnpm --filter @neurocare/platform deploy --prod /app/frontend-deploy

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV API_INTERNAL_URL=http://backend:4000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built application + self-contained deployed package
COPY --from=builder --chown=nodejs:nodejs /app/frontend-deploy/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/frontend-deploy/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/neurocare-platform/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/apps/neurocare-platform/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nodejs:nodejs /app/apps/neurocare-platform/public ./public

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD node -e "fetch('http://localhost:3000/').then(r=>{if(!r.ok)process.exit(1)})"

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
