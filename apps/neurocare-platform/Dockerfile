# syntax=docker.io/docker/dockerfile:1
# Frontend multi-stage Docker build
FROM node:24-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/neurocare-platform/package.json apps/neurocare-platform/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci 2>/dev/null || npm ci --omit=dev 2>/dev/null || true
COPY apps/neurocare-platform/ ./
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
COPY --from=builder /app/.next ./ .next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
