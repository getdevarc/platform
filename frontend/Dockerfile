# Multi-stage production Dockerfile for Next.js app
# Base image stage
FROM node:22-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies only when needed stage
FROM base AS deps
COPY package.json package-lock.json* ./
# Install dependency packages (including devDeps for build)
RUN npm ci --include=dev

# Rebuild the source code only when needed stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables definitions
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Disable telemetry during build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production runner image stage
FROM base AS runner

# Set Next.js runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root system user and home directory for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Set up working directory owner permissions
WORKDIR /app

# Copy public folder for static client file generation
COPY --from=builder /app/public ./public

# Automatically leverage standalone output traces to reduce image size
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Perform user switch as default executor
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
