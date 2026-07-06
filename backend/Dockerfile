# Stage 1: Build production node_modules
FROM node:22-slim AS builder

WORKDIR /app

# Install native dependencies build tools
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Install only production dependencies, compiling native addons like bcrypt
RUN JOBS=1 npm ci --omit=dev

# Stage 2: Runtime image
FROM node:22-slim

ENV NODE_ENV=production
ENV PORT=5050

WORKDIR /app

# Ensure we run as non-root user
USER node

# Copy package descriptors
COPY --chown=node:node package.json package-lock.json ./

# Copy built node_modules from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copy application source files
COPY --chown=node:node src/ ./src/
COPY --chown=node:node run_migrations.js ./

EXPOSE 5050

CMD ["node", "src/server.js"]
