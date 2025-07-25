# Stage 1: Build Next.js
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Final image with nginx and Next.js
FROM nginx:1.23.4-alpine
RUN apk add --no-cache nodejs npm dumb-init
WORKDIR /app
COPY --from=builder /app /app
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3001 445

# Entrypoint script runs both Node and nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/docker-entrypoint.sh"]
