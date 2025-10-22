FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev


FROM node:24-alpine AS production

WORKDIR /usr/src/app

ENV BANNED_LIST_LOCATION=/usr/src/app/data/banned_users.txt

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

RUN addgroup -S appgroup && adduser -S -G appgroup appuser && \
    mkdir -p /usr/src/app/data && \
    chown -R appuser:appgroup /usr/src/app/data

VOLUME /usr/src/app/data

USER appuser

CMD [ "node", "dist/index.js" ]