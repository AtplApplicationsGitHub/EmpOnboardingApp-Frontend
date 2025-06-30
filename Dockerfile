# Stage 1: Build Next.js
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Final image with nginx and Next.js
FROM nginx:1.23.4-alpine

# Install Node.js and dumb-init (init system to run multiple processes)
RUN apk add --no-cache nodejs npm dumb-init

WORKDIR /app

# Copy Next.js build artifacts and node_modules
COPY --from=builder /app /app

# Copy nginx config and SSL cert mounts (expected to be mounted as volumes at runtime)
COPY nginx.conf /etc/nginx/nginx.conf

# Expose only the ports in your config
EXPOSE 3100 444 8081

# Entrypoint script runs both Node and nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/docker-entrypoint.sh"]
