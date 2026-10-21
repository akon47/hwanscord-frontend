# HWANSCORD frontend image (akon47/hwanscord-frontend).
# Works with the legacy (non-BuildKit) builder: no `# syntax`, no RUN --mount, no heredocs.
# The legacy builder builds every stage *before* --target, so `test` is the LAST stage:
#   docker build --target test .      → lint + typecheck + unit tests (Jenkins "Test" stage)
#   docker build --target runtime .   → deps → build → runtime only (tests are not re-run)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
ARG APP_VERSION=dev
ENV VITE_APP_VERSION=${APP_VERSION}
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
ARG APP_VERSION=dev
LABEL org.opencontainers.image.title="hwanscord-frontend" \
      org.opencontainers.image.source="https://github.com/akon47/hwanscord-frontend" \
      org.opencontainers.image.version="${APP_VERSION}"
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/hwanscord.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo "${APP_VERSION}" > /usr/share/nginx/html/version.txt
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/index.html || exit 1

FROM deps AS test
COPY . .
RUN npm run lint && npm run typecheck && npm test -- --run
