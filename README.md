# PlateformK (frontend)

Application Angular de gestion d'activité de soutien scolaire (professeurs, parents, élèves).

## Stack

- **Angular 21** (standalone components, signals, control flow `@if` / `@for`)
- **TypeScript 5.9**, ESLint (angular-eslint)
- **Karma + Jasmine** pour les tests unitaires
- **Playwright** pour les tests E2E
- **nginx** (image de production) servi derrière un reverse proxy

## Prérequis

- Node.js **22+** (le projet est développé/testé sous Node 24, CI en Node 22)
- npm
- Un backend `back-plateformK` accessible (Spring Boot) pour les fonctionnalités authentifiées

## Installation

```bash
npm install
```

## Environnements

La configuration d'API est définie dans `src/environments/` :

| Fichier | Usage | `apiUrl` |
| --- | --- | --- |
| `environment.ts` | développement | `http://localhost:8080/api/v1/` |
| `environment.prod.ts` | production | à renseigner (domaine réel) |

Le build de production remplace automatiquement `environment.ts` par `environment.prod.ts`
(voir `angular.json`, `fileReplacements`).

## Démarrage

```bash
npm start        # ng serve sur http://localhost:4200
```

En développement, un proxy peut être utilisé via `proxy.conf.json`.

## Scripts

| Commande | Description |
| --- | --- |
| `npm start` | Serveur de développement |
| `npm run build` | Build de production (`dist/`) |
| `npm test` | Tests unitaires (watch) |
| `npm run test:ci` | Tests unitaires headless (CI) |
| `npm run lint` | ESLint |
| `npm run e2e` | Tests E2E Playwright |
| `npm run e2e:noauth` | E2E sans authentification (utilisé en CI) |
| `npm run e2e:ui` / `e2e:headed` / `e2e:debug` | E2E en mode interactif |

## Tests

### Unitaires

```bash
CHROME_BIN=$(command -v chromium || command -v google-chrome) npm run test:ci
```

`npm run test:ci` mesure la couverture et échoue si les seuils minimaux définis dans
`karma.conf.js` ne sont pas atteints (garde-fou anti-régression). Le rapport est publié en CI.

### E2E (Playwright)

Les tests E2E sont répartis en deux familles :

- **sans authentification** (`*.noauth.spec.ts`) : page de connexion et protection des routes.
  Ils ne nécessitent que le frontend et s'exécutent en CI.
- **authentifiés** : nécessitent un backend disponible et un compte de test
  (`test@klassio.com`). Le projet `setup` tente la connexion ; en cas d'échec, un marqueur
  est écrit et les suites authentifiées sont **ignorées proprement** au lieu d'échouer.

```bash
npx playwright install --with-deps chromium
npm run e2e:noauth     # CI, sans backend
npm run e2e            # suite complète (backend requis pour les suites authentifiées)
```

## Docker

```bash
# Image de production (multi-stage Node -> nginx)
docker build -f Containerfile -t plateformk .

# Environnement de développement
docker compose up
```

`nginx.conf` définit les en-têtes de sécurité (CSP, Permissions-Policy) et le fallback SPA.
Le TLS doit être terminé par le reverse proxy en amont.

## Haute disponibilité (HA)

Les deux applications sont **sans état** et prêtes pour un déploiement multi-instances derrière
un répartiteur de charge :

- **Frontend** : assets statiques servis par nginx, aucune session ni état local.
- **Backend** : authentification JWT sans session serveur ; rate-limiting et tâches planifiées
  (`ShedLock`) partagés via Valkey / MySQL ; aucun stockage fichier local (les PDF de factures
  sont générés et streamés en mémoire).

Pour passer de mono-instance à HA :

1. Plusieurs réplicas backend + front derrière un load balancer TLS avec healthchecks.
2. MySQL et Valkey partagés entre les instances.
3. **Notifications temps réel** : activer le broker STOMP externe côté backend
   (`app.websocket.distributed-broker.enabled=true` + hôte/port/identifiants du relay), sinon les
   messages publiés sur un nœud ne sont pas distribués aux autres.
4. Aucune session collante (sticky session) n'est requise pour le HTTP ; avec le broker externe,
   le client WebSocket peut se reconnecter à n'importe quel nœud.
5. Pas de volume partagé nécessaire (absence d'état sur disque).

**Décision actuelle** : déploiement mono-instance assumé (une panne entraîne une
indisponibilité). Le code est prêt pour l'extension en HA sans modification.

## Structure

```
src/app/
├── core/            # auth (services, guards, interceptors), http
├── features/        # dashboards, login, profile, settings, register-invitation
└── shared/          # composants, services, modèles, utils
```

## Sécurité

- Les jetons JWT sont conservés côté navigateur (accès court, 15 min) et transmis via
  l'intercepteur `auth.interceptor`. **Choix assumé** : ce stockage reste exposé en cas de
  XSS ; il est mitigé par une CSP stricte (`nginx.conf`), l'absence d'injection de HTML non
  fiable et la durée de vie courte du jeton. L'alternative (cookie `HttpOnly`) n'a pas été
  retenue à ce stade.
- Les erreurs HTTP sont normalisées et re-loguées de façon conditionnelle à l'environnement.
