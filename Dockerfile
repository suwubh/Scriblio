FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_SIGNALING_URLS=ws://localhost:4000
ARG VITE_REDIS_WS_URL=ws://localhost:8080
ARG VITE_WEBSOCKET_URL=wss://demos.yjs.dev/ws
ARG VITE_PROXY_URL=http://localhost:3001/api/chat
ENV VITE_SIGNALING_URLS=$VITE_SIGNALING_URLS \
    VITE_REDIS_WS_URL=$VITE_REDIS_WS_URL \
    VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL \
    VITE_PROXY_URL=$VITE_PROXY_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
