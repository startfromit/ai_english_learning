# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Copy .env.build for build-time dummy envs
COPY .env.build .env.build
# shell form to load envs from .env.build for build step
SHELL ["/bin/sh", "-c"]
RUN export $(grep -v '^#' .env.build | xargs) && pnpm build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm runtime for production
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy only necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/env.example ./env.example

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Use non-root user
RUN adduser -D appuser
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables (documented, not hardcoded)
# See env.example for required variables

# Start the app
CMD ["pnpm", "start"] 