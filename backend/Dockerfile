# CodeBuild / ECS — imágenes base desde AWS Public ECR (no Docker Hub).
FROM public.ecr.aws/docker/library/node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM public.ecr.aws/docker/library/node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs \
    && mkdir -p /app/data && chown nodejs:nodejs /app/data
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs
EXPOSE 3001
CMD ["node", "dist/index.js"]
