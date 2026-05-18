# --- build dependencies in an isolated stage so the final image is slim ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
EXPOSE 4000 4001
USER node
CMD ["node", "server.js"]
