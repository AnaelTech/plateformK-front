// src/app/core/http/interceptors/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take, throwError, Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

/** Endpoints d'authentification qui ne doivent pas déclencher de refresh. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

/**
 * Intercepteur HTTP pour gérer le refresh automatique du token JWT.
 *
 * 1. Ajoute le token JWT à chaque requête sortante (hors endpoints d'auth).
 * 2. Intercepte les erreurs 401 et tente de rafraîchir le token une seule fois.
 * 3. Rejoue la requête initiale avec le nouveau token.
 * 4. En cas d'échec du refresh, termine les requêtes en attente et redirige vers le login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Ne pas gérer le token/refresh pour les endpoints d'authentification
  // (login, register, refresh, logout) afin d'éviter toute boucle.
  if (AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint))) {
    return next(req);
  }

  const token = authService.getToken();
  if (token && !authService.isTokenExpired(token)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Un refresh est déjà en cours : attendre le nouveau token.
      if (authService.getIsRefreshing()) {
        return authService.getRefreshTokenSubject().pipe(
          filter((newToken): newToken is string => newToken !== null),
          take(1),
          switchMap((newToken) =>
            next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              }),
            ),
          ),
        );
      }

      return handleTokenRefresh(authService, req, next);
    }),
  );
};

/**
 * Gère le rafraîchissement du token JWT.
 */
function handleTokenRefresh(
  authService: AuthService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  authService.setIsRefreshing(true);
  authService.getRefreshTokenSubject().next(null);

  return authService.refreshToken().pipe(
    switchMap((response) => {
      authService.setIsRefreshing(false);
      authService.getRefreshTokenSubject().next(response.accessToken);

      return next(
        req.clone({
          setHeaders: { Authorization: `Bearer ${response.accessToken}` },
        }),
      );
    }),
    catchError((error) => {
      authService.setIsRefreshing(false);
      // Termine les requêtes en attente (sinon elles restent suspendues),
      // puis recrée un subject sain pour les prochaines tentatives.
      authService.getRefreshTokenSubject().error(error);
      authService.resetRefreshTokenSubject();
      authService.logout('/login');
      return throwError(() => error);
    }),
  );
}
