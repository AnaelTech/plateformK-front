# ===================================
# Multi-stage build pour Angular 19
# ===================================

# Stage 1 : Build avec Node.js
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Build de production
RUN npm run build -- --configuration=production

# Stage 2 : Serveur Nginx léger
FROM nginx:1.27-alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist/plateform-k/browser /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
