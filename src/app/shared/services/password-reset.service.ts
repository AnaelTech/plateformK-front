import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  TokenValidationResponse,
} from '../models/password-reset.model';

/**
 * Service pour la réinitialisation de mot de passe.
 * Gère les demandes de reset et la confirmation avec token.
 */
@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private readonly apiUrl = `${environment.apiUrl}password`;

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _success = signal<boolean>(false);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly success = this._success.asReadonly();

  private readonly http = inject(HttpClient);

  /**
   * Demande un email de réinitialisation de mot de passe.
   * L'API renvoie toujours un succès pour des raisons de sécurité.
   */
  requestPasswordReset(email: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    this._success.set(false);

    const request: PasswordResetRequest = { email };

    return this.http.post<void>(`${this.apiUrl}/reset-request`, request).pipe(
      tap(() => {
        this._loading.set(false);
        this._success.set(true);
      }),
      catchError((error) => {
        this._loading.set(false);
        this._error.set(
          error.error?.message ||
            'Erreur lors de la demande de réinitialisation',
        );
        throw error;
      }),
    );
  }

  /**
   * Valide un token de réinitialisation.
   */
  validateToken(token: string): Observable<TokenValidationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<TokenValidationResponse>(`${this.apiUrl}/validate-token`, {
        params: { token },
      })
      .pipe(
        tap(() => {
          this._loading.set(false);
        }),
        catchError((error) => {
          this._loading.set(false);
          this._error.set(error.error?.message || 'Token invalide ou expiré');
          throw error;
        }),
      );
  }

  /**
   * Confirme la réinitialisation avec le nouveau mot de passe.
   */
  confirmPasswordReset(token: string, newPassword: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    this._success.set(false);

    const request: PasswordResetConfirmRequest = { token, newPassword };

    return this.http.post<void>(`${this.apiUrl}/reset-confirm`, request).pipe(
      tap(() => {
        this._loading.set(false);
        this._success.set(true);
      }),
      catchError((error) => {
        this._loading.set(false);
        this._error.set(
          error.error?.message ||
            'Erreur lors de la réinitialisation du mot de passe',
        );
        throw error;
      }),
    );
  }

  /**
   * Réinitialise l'état du service.
   */
  resetState(): void {
    this._loading.set(false);
    this._error.set(null);
    this._success.set(false);
  }
}
