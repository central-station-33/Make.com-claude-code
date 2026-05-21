FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Non-root user for security
RUN addgroup -S inrange && adduser -S inrange -G inrange
USER inrange

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health/ping || exit 1

CMD ["node", "src/index.js"]
