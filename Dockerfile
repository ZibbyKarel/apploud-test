# Container image for the Next.js app. Shared by both compose files:
#   - docker-compose.yml         → a single instance (in-memory path)
#   - docker-compose.cluster.yml → MULTIPLE instances next to one Redis,
#     exercising the multi-instance path (shared rate limiter + shared report
#     cache — see docs/SCALABILITY.md).
#
# Deliberately a plain build-and-`next start` image, NOT Next's `standalone`
# output: this is a local test harness, so robustness beats image size. The
# standalone tracer has known sharp edges (manual static/public copying,
# next-intl message tracing) that would add failure surface here for no benefit.
FROM node:22-alpine

WORKDIR /app

# Install deps first so the layer caches across source-only edits.
COPY package.json package-lock.json ./
RUN npm ci

# Build. The .dockerignore keeps node_modules/.next/.git etc. out of context.
COPY . .
RUN npm run build

EXPOSE 3000
# REDIS_URL / GITLAB_TOKEN are supplied by docker-compose (env_file + environment).
CMD ["npm", "start"]
