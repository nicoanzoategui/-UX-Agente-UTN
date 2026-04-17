# Debian slim: @libsql/client suele fallar en Alpine (musl) en algunos entornos ECS.
FROM public.ecr.aws/docker/library/node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM public.ecr.aws/docker/library/node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd -r nodejs -g 1001 && useradd -r -u 1001 -g nodejs nodejs \
    && mkdir -p /app/data && chown nodejs:nodejs /app/data
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs
EXPOSE 3001
CMD ["node", "dist/index.js"]
