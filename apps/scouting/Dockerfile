FROM node:24-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN npm i -g turbo
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "web" is the name entered in the project's package.json: { name: "web" }
RUN turbo prune scouting --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
# NOTE: pnpm-workspace.yaml pins next's @swc/helpers to 0.5.15. Newer versions
# add a `module-sync` export condition; under pnpm's symlinked layout Next's
# file tracer only copies the cjs build into .next/standalone, while the node:24
# runtime below honours `module-sync` and loads the ESM build that was never
# traced -- the server then dies at boot with MODULE_NOT_FOUND. Don't drop that
# override without checking `node apps/scouting/server.js` still starts.
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm dlx turbo run build --filter=scouting

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# COPY --from=installer --chown=nextjs:nodejs /app/packages/database ./packages/database
COPY --from=installer --chown=nextjs:nodejs /app/apps/scouting/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/scouting/.next/static ./apps/scouting/.next/static
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/scouting/server.js