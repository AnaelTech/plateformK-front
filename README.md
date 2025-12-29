# PlateformK

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.12.

## TODO

[ ] Put project on Github
[ ] Build login page
[ ] Build model for login page

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

# front-plateformK

## Description

Interface utilisateur de la solution de gestion de facture

## Version Node.js

- Node.js v22.17.1
- npm 11.5.2

## Version Angular

- Angular CLI 19.2.12
- Angular Framework 19.2.0

## Version TypeScript

- TypeScript 5.7.2

## Base de données

- API REST (back-plateformK)

## 📖 Guide de Déploiement – Application Angular

### 1. Pré-requis
*Serveur*

- OS : Linux (Ubuntu/Debian/CentOS) ou Windows Server
- Réseau : Accès SSH (Linux) ou RDP (Windows)
- Ports ouverts : 80, 443 (HTTPS), 4200 (développement)

### 2. Installation des dépendances (Linux)

Mettre à jour le serveur :

```bash
sudo apt update && sudo apt upgrade -y
```

Installation de Node.js et npm :

```bash
# Via NodeSource repository (recommandé)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier les versions
node --version
npm --version
```

Installation d'Angular CLI :

```bash
# Installation globale d'Angular CLI
sudo npm install -g @angular/cli@19.2.12

# Vérifier la version
ng version
```

Installation de Git :

```bash
sudo apt install git -y
git --version
```

>[!WARNING]
>Si vous utilisez Docker, seule l'installation de Docker et Git est nécessaire. Node.js et Angular CLI ne sont pas requis, car ils sont déjà gérés dans l'image.

```bash
sudo apt-get install docker.io -y
```

## Cloner le projet

```bash
git clone https://github.com/AnaelTech/front-plateformK
cd front-plateformK
```

## Configuration de l'environnement

>[!TIP]
> Les fichiers de configuration se trouvent dans `src/environments/`.

### Environnement de développement (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  appName: 'PlateformK Dev'
};
```

### Environnement de production (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.votre-domaine.com/api',
  appName: 'PlateformK'
};
```

## Installation des dépendances

```bash
# Installer les dépendances du projet
npm install

# ou avec cache nettoyé
npm ci
```

## 🔨 Build du projet avec Angular CLI

### Build de développement
```bash
# Serveur de développement
ng serve

# Serveur de développement avec rechargement automatique
ng serve --open

# Build de développement
ng build
```

### Build de production
```bash
# Build optimisé pour la production
ng build --configuration production

# Build avec optimisations avancées
ng build --prod --aot --build-optimizer

# Vérifier les fichiers générés
ls -la dist/
```

## Tests

```bash
# Tests unitaires
ng test

# Tests unitaires en mode CI
ng test --watch=false --browsers=ChromeHeadless

# Tests end-to-end
ng e2e

# Linting du code
ng lint
```

## Lancer l'application

```bash
# Mode développement
ng serve --port 4200

# Mode développement avec host spécifique
ng serve --host 0.0.0.0 --port 4200

# Servir les fichiers buildés (nécessite un serveur web)
npx http-server dist/front-plateformk -p 8080
```

## 🚀 Déploiement de l'application

### Build de production

```bash
# Build optimisé pour la production
ng build --configuration production

# Vérifier les fichiers générés
ls -la dist/front-plateformk/
```

## URLs d'accès

- **Développement :** http://localhost:4200

## Déploiement avec Docker

### Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN ng build --configuration production

# Production stage  
FROM nginx:alpine
COPY --from=build /app/dist/front-plateformk /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
  backend:
    image: back-plateformk:latest
    ports:
      - "4200:4200"
```

```bash
# Avec Dockerfile
docker build -t front-plateformk .
docker run -d -p 80:80 front-plateformk

# Avec Docker Compose
docker-compose up -d
```


## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence [MIT](LICENSE).

---

>Généré avec le script GitHub Repository Creator