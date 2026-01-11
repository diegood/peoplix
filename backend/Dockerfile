FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY src ./src
COPY index.js ./

RUN pnpm prisma generate

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node index.js"]
