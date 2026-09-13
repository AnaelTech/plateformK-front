import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EmailValidationConfirmRequest,
} from '../models/email-validation.model';

/**
 * Service pour la validation d'email.
 * Permet d'envoyer un code de validation et de le confirmer.
 */
@Injectable({
  providedIn: 'root',
})
export class EmailValidationService {
  private readonly apiUrl = `${environment.apiUrl}email`;

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _codeSent = signal<boolean>(false);
  private readonly _validated = signal<boolean>(false);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly codeSent = this._codeSent.asReadonly();
  readonly validated = this._validated.asReadonly();

  private readonly http = inject(HttpClient);

  /**
   * Envoie un code de validation par email à l'utilisateur connecté.
   */
  sendValidationCode(): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    this._codeSent.set(false);

    return this.http.post<void>(`${this.apiUrl}/send-validation`, {}).pipe(
      tap(() => {
        this._loading.set(false);
        this._codeSent.set(true);
      }),
      catchError((error) => {
        this._loading.set(false);
        this._error.set(
          error.error?.message || "Erreur lors de l'envoi du code",
        );
        throw error;
      }),
    );
  }

  /**
   * Valide le code reçu par email.
   */
  validateCode(code: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    const request: EmailValidationConfirmRequest = { code };

    return this.http.post<void>(`${this.apiUrl}/validate`, request).pipe(
      tap(() => {
        this._loading.set(false);
        this._validated.set(true);
      }),
      catchError((error) => {
        this._loading.set(false);
        this._error.set(error.error?.message || 'Code invalide ou expiré');
        throw error;
      }),
    );
  }

  /**
   * Vérifie si l'email de l'utilisateur connecté est validé.
   * Le backend retourne HTTP 200 si validé, HTTP 400 sinon (sans body).
   * Cette méthode retourne un Observable<boolean>.
   */
  getValidationStatus(): Observable<boolean> {
    return this.http.get<void>(`${this.apiUrl}/validation-status`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /**
   * Réinitialise l'état du service.
   */
  resetState(): void {
    this._loading.set(false);
    this._error.set(null);
    this._codeSent.set(false);
    this._validated.set(false);
  }
}
