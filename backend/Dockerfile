FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl python3 python-is-python3 make g++ curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY shared/ ./shared/
COPY backend/package*.json ./backend/

RUN npm ci

COPY backend/ ./backend/
WORKDIR /app/backend
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    python3-pip \
    python-is-python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

RUN npm ci --only=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules

COPY backend/docker-entrypoint.sh ./backend/
RUN chmod +x ./backend/docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/app/backend/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
