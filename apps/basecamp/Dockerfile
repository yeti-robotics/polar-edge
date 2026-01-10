FROM node:22-alpine AS builder
RUN apk update

WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm dlx turbo prune basecamp --docker

FROM node:22-alpine AS installer
RUN apk update

WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/turbo.json ./turbo.json
RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=builder /app/out/full/ .
RUN corepack enable pnpm
RUN pnpm dlx turbo run build --filter=basecamp

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=sourcer /app/ .

CMD ["node", "apps/basecamp/dist/main.js"]