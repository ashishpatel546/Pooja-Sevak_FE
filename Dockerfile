# syntax=docker/dockerfile:1

# ---- deps: install exactly what package-lock.json pins ----
# Node 26 LTS ("Lithium"); keep all three stages on the same tag.
FROM node:26-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# postinstall runs scripts/copy-pdfjs-assets.mjs, so it must exist before npm ci
COPY scripts ./scripts
RUN npm ci

# ---- build: compile the standalone Next.js server ----
FROM node:26-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_API_URL=http://localhost:6001/v1
ARG NEXT_PUBLIC_SITE_URL=http://localhost:6002
# "true" only for the production image (search engines may index it); stage stays noindex.
ARG NEXT_PUBLIC_INDEXABLE=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_INDEXABLE=$NEXT_PUBLIC_INDEXABLE \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime: only the standalone output, as a non-root user ----
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=6002 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 6002
CMD ["node", "server.js"]
