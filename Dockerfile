FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN BUILDING=1 ORIGIN=http://localhost:3000 BETTER_AUTH_SECRET=build_time_placeholder_secret_32_chars DATABASE_URL=postgres://user:password@localhost:5432/db_name ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000 npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/lib/server/db ./src/lib/server/db
COPY --from=build /app/scripts ./scripts

EXPOSE 3000

CMD ["node", "build"]
