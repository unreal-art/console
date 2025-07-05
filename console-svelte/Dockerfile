# Build stage
FROM node:22 AS builder
WORKDIR /app

ENV PUBLIC_FC_HOST='https://zauth.netlify.app'
ENV PUBLIC_DEV_SHOW_MAC=null

#COPY package*.json pnpm-lock.yaml ./

COPY . .

RUN cp .env.example .env
# RUN cp .env.docker .env.local

RUN npm run setup:min
RUN bun install
RUN bun run build

# Deploy stage
FROM node:22-alpine

ENV PORT=80
ENV NODE_ENV="production"
ENV MODE="prod"

WORKDIR /app

EXPOSE $PORT

COPY --from=builder /app/build .



RUN npm install -g vite


# ENTRYPOINT ["vite", "--port", "${PORT}", "--host", "0.0.0.0"]
# vite dev issues: https://github.com/vitejs/vite/issues/17713

WORKDIR /
ENTRYPOINT ["vite", "preview", "--outDir","/app" ,"--port", "${PORT}", "--host", "0.0.0.0"]
# CMD ["--port", "${PORT}"]

LABEL maintainer="Hiro <laciferin@gmail.com>"
