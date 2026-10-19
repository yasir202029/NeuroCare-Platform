# ============================================================================
# Marketing Site Dockerfile (pnpm workspace, root context)
# Build from repo root: docker build -f apps/marketing-site/Dockerfile .
# ============================================================================
FROM node:24-alpine AS prereqs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH=/usr/local/lib/node_modules/corepack/shims:$PATH
RUN corepack prepare pnpm@latest --activate && corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps/marketing-site/package.json ./apps/marketing-site/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts=false && pnpm store prune

FROM node:24-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH=/usr/local/lib/node_modules/corepack/shims:$PATH
COPY --from=prereqs /app /app
COPY apps/marketing-site ./apps/marketing-site
WORKDIR /app/apps/marketing-site
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN pnpm run build && cd /app && pnpm --filter @neuroassess/marketing-site deploy --prod /app/marketing-deploy

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/marketing-deploy/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/marketing-deploy/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/marketing-site/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/apps/marketing-site/next.config.mjs ./next.config.mjs
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s CMD node -e "fetch('http://localhost:3001/').then(r=>{if(!r.ok)process.exit(1)})"
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]
