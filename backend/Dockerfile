# syntax=docker.io/docker/dockerfile:1
# Backend multi-stage Docker build
FROM node:24-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN --mount=type=cache,target=/root/.npm npm install --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
