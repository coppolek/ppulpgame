# Stage 1: Build the React + Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests, .npmrc, and lockfile
COPY package*.json .npmrc* ./
RUN npm install

# Copy full source and build
COPY . .
RUN npm run build

# Stage 2: Production lightweight runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copy runtime server and built assets
COPY --from=builder /app/package*.json /app/.npmrc* ./
RUN npm install --omit=dev
COPY --from=builder /app/server.js ./
COPY --from=builder /app/app.js ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "server.js"]
