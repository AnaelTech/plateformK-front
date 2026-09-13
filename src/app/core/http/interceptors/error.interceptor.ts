import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification.service';
import { environment } from '../../../../environments/environment';

/**
 * Intercepteur d'erreurs HTTP global.
 *
 * Affiche un message utilisateur (français) via NotificationService et rejette
 * l'erreur d'origine (`HttpErrorResponse`) afin que les composants puissent lire
 * `err.status` et `err.error.message`. Les logs console sont désactivés en production.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService: NotificationService = inject(NotificationService);

  const logError = (...args: unknown[]): void => {
    if (!environment.production) {
      console.error(...args);
    }
  };

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.error instanceof ErrorEvent) {
        // Erreur réseau / côté client
        logError('Erreur client :', error.error.message);
        notificationService.error(
          'Erreur réseau : impossible de contacter le serveur.',
          5000,
        );
      } else {
        switch (error.status) {
          case 400:
            notificationService.error(
              error.error?.message || 'Requête invalide : données incorrectes.',
            );
            logError('Requête invalide (400) :', error.error);
            break;

          case 401:
            // Géré par authInterceptor (refresh). Notifier uniquement si le refresh échoue.
            if (req.url.includes('/auth/refresh')) {
              logError('Authentification échouée (401)');
              notificationService.error(
                'Session expirée. Veuillez vous reconnecter.',
                5000,
              );
            }
            break;

          case 403:
            notificationService.error(
              "Accès refusé : vous n'avez pas la permission d'effectuer cette action.",
              5000,
            );
            logError('Accès refusé (403) :', error.url);
            break;

          case 404:
            notificationService.error(
              error.error?.message || 'Ressource introuvable.',
            );
            logError('Ressource introuvable (404) :', error.url);
            break;

          case 409:
            notificationService.warning(
              error.error?.message || 'Conflit : la ressource existe déjà.',
            );
            logError('Conflit (409) :', error.error);
            break;

          case 422:
            notificationService.warning(
              error.error?.message || 'Erreur de validation : vérifiez vos saisies.',
            );
            logError('Erreur de validation (422) :', error.error);
            break;

          case 429: {
            let message =
              error.error?.message ||
              'Trop de requêtes. Veuillez réessayer plus tard.';
            const retryAfter = error.headers.get('Retry-After');
            if (retryAfter) {
              message += ` Réessayez dans ${retryAfter} secondes.`;
            }
            notificationService.warning(message, 5000);
            logError('Limite de requêtes (429) :', message);
            break;
          }

          case 500:
            notificationService.error(
              'Erreur serveur : une erreur interne est survenue.',
              5000,
            );
            logError('Erreur serveur (500) :', error.error);
            break;

          case 502:
            notificationService.error(
              'Passerelle invalide : le serveur est temporairement indisponible.',
              5000,
            );
            logError('Bad Gateway (502)');
            break;

          case 503:
            notificationService.error(
              'Service indisponible : le serveur est en maintenance.',
              5000,
            );
            logError('Service indisponible (503)');
            break;

          case 504:
            notificationService.error(
              'Délai dépassé : la requête a pris trop de temps.',
              5000,
            );
            logError('Gateway Timeout (504)');
            break;

          case 0:
            notificationService.error(
              'Erreur réseau : impossible de joindre le serveur. Vérifiez votre connexion.',
              5000,
            );
            logError('Erreur réseau (0) : serveur injoignable');
            break;

          default:
            notificationService.error(
              error.error?.message ||
                `Erreur inattendue (${error.status}).`,
            );
            logError(`Erreur HTTP (${error.status}) :`, error.error);
        }
      }

      // Rejeter l'erreur d'origine pour que les composants gardent `status` et `error`.
      return throwError(() => error);
    }),
  );
};
