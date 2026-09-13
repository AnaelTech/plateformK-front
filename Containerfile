# =========================================================
# Stage 1 : Build Angular (production)
# =========================================================
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# =========================================================
# Stage 2 : Nginx servant les fichiers statiques
# =========================================================
FROM nginx:alpine

# Configuration nginx (routing SPA, cache, gzip, security headers)
COPY nginx.conf /etc/nginx/nginx.conf

# Build Angular production
COPY --from=build /app/dist/plateform-k/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
