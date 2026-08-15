# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
RUN apk add --no-cache libc6-compat && apk update
WORKDIR /app
RUN pnpm install turbo --global

COPY . .
RUN turbo prune basecamp --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat && apk update
WORKDIR /app

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm turbo build --filter=basecamp

# Produce a self-contained deployment directory with only prod deps
RUN pnpm --filter=basecamp deploy --prod --legacy /app/deploy

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

COPY --from=installer --chown=nodejs:nodejs /app/apps/basecamp/dist ./apps/basecamp/dist
COPY --from=installer --chown=nodejs:nodejs /app/deploy/node_modules ./apps/basecamp/node_modules

CMD ["node", "apps/basecamp/dist/main.js"]
