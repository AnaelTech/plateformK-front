// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;

  if (token && !authService.isTokenExpired(token)) {
    // Un seul clone avec tous les headers nécessaires
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      // withCredentials seulement si tu utilises des cookies (rare avec JWT)
      // withCredentials: true,
    });
  }

  return next(authReq).pipe(
    catchError((err) => {
      if (
        err.status === 401 ||
        (err.status === 403 && authService.isLoggedIn())
      ) {
        authService.logout(); // ou rediriger vers login
      }
      return throwError(() => err);
    })
  );
};
