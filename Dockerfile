# Use the official Node.js runtime as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use production schema for PostgreSQL and generate client
RUN cp prisma/schema.prod.prisma prisma/schema.prisma
RUN npx prisma generate

# Build the application
RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy our custom server.js for Socket.IO support
COPY --from=builder /app/server.js ./

# Install production dependencies
COPY --from=builder /app/package.json ./
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

# Copy Prisma files and generated client from builder (already generated, no need to regenerate)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy startup script
COPY scripts/docker-entrypoint.sh ./scripts/
RUN chmod +x ./scripts/docker-entrypoint.sh

# Create uploads directory for images and fix permissions
RUN mkdir -p data/uploads && \
    chown -R nextjs:nodejs data && \
    chown -R nextjs:nodejs scripts && \
    chown -R nextjs:nodejs prisma && \
    chown -R nextjs:nodejs node_modules && \
    chown nextjs:nodejs /app && \
    chmod 755 /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use startup script
CMD ["./scripts/docker-entrypoint.sh"]
