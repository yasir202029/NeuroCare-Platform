# ============================================================================
# NeuroCare Platform - Backend Dockerfile (pnpm workspace, root context)
# Build from repo root: docker build -f backend/Dockerfile .
# ============================================================================

# Stage 0: prereqs — workspace install + Prisma client generation
# (also used as the "target" for the one-shot migrate service in compose)
FROM node:24-alpine AS prereqs

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN corepack prepare pnpm@latest --activate && corepack enable

# Copy workspace manifests BEFORE install so pnpm recognizes every
# package (backend, apps/*, packages/*, libs/*) as a workspace project.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY backend/package.json ./backend/package.json
COPY backend/prisma ./backend/prisma
RUN pnpm install --frozen-lockfile --ignore-scripts=false && \
    pnpm store prune && \
    cd backend && pnpm exec prisma generate

# Bundle the backend's schema (deploy step needs it in package dir)
ENV PRISMA_SCHEMA=/app/backend/prisma/schema.prisma

# Stage 1: build — compile TypeScript to backend/dist
FROM prereqs AS builder
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src

# Build emits to backend/dist (outDir is relative to the tsconfig location)
RUN cd backend && pnpm exec prisma generate && \
    pnpm run build && \
    cd /app && \
    pnpm --filter @workspace/clinic-backend deploy --prod /app/backend-deploy

# Stage 2: runtime — minimal production image
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
# Copy built application + self-contained deployed package
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/backend-deploy/node_modules ./node_modules

USER nodejs
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD node -e "fetch('http://localhost:4000/api/v1/health').then(r=>{if(!r.ok)process.exit(1)})"

CMD ["node", "dist/server.js"]

