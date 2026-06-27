FROM node:22-alpine AS builder
WORKDIR /app

COPY packages/contracts ./packages/contracts
RUN cd packages/contracts && npm ci && npm run build

COPY apps/brain/package.json apps/brain/package-lock.json* ./apps/brain/
WORKDIR /app/apps/brain
RUN npm ci 2>/dev/null || npm install

COPY apps/brain ./ 
RUN npm run build

FROM node:22-alpine
WORKDIR /app/apps/brain
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/packages/contracts /app/packages/contracts
COPY --from=builder /app/apps/brain/package.json ./
COPY --from=builder /app/apps/brain/node_modules ./node_modules
COPY --from=builder /app/apps/brain/dist ./dist
COPY --from=builder /app/apps/brain/migrations ./migrations

EXPOSE 3000
CMD ["node", "dist/index.js"]
