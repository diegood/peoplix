
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ARG VITE_API_HTTP_URL
ARG VITE_API_WS_URL
ENV VITE_API_HTTP_URL=${VITE_API_HTTP_URL}
ENV VITE_API_WS_URL=${VITE_API_WS_URL}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist/ .

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY docker-entrypoint.sh /docker-entrypoint.d/10-gen-config.sh
RUN chmod +x /docker-entrypoint.d/10-gen-config.sh

EXPOSE 80 443
