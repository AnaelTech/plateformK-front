// src/app/core/http/interceptors/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  filter,
  take,
  throwError,
  Observable,
} from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Intercepteur HTTP pour gérer le refresh automatique du token JWT
 *
 * Fonctionnement:
 * 1. Ajoute le token JWT à chaque requête sortante
 * 2. Intercepte les erreurs 401 (Unauthorized)
 * 3. Tente de rafraîchir le token automatiquement
 * 4. Rejoue la requête initiale avec le nouveau token
 * 5. Si le refresh échoue, redirige vers le login
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Ne pas ajouter le token aux requêtes d'authentification
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    return next(req);
  }

  // Ajouter le token JWT à la requête
  const token = authService.getToken();
  if (token && !authService.isTokenExpired(token)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Gérer les erreurs et le refresh automatique
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si erreur 401 et que le token n'est pas déjà en cours de rafraîchissement
      if (error.status === 401 && !authService.getIsRefreshing()) {
        return handleTokenRefresh(authService, req, next);
      }

      // Si déjà en cours de rafraîchissement, attendre le nouveau token
      if (error.status === 401 && authService.getIsRefreshing()) {
        return authService.getRefreshTokenSubject().pipe(
          filter((token) => token !== null),
          take(1),
          switchMap((token) => {
            return next(
              req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`,
                },
              }),
            );
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

/**
 * Gère le rafraîchissement du token JWT
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

      // Rejouer la requête initiale avec le nouveau token
      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${response.accessToken}`,
          },
        }),
      );
    }),
    catchError((error) => {
      authService.setIsRefreshing(false);
      authService.logout('/login');
      return throwError(() => error);
    }),
  );
}
