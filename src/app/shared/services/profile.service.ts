import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UpdateProfileRequest,
  ChangePasswordRequest,
  ProfileResponse,
} from '../models/profile.model';
import { User } from '../models/User';

/**
 * Service pour la gestion du profil utilisateur.
 * Permet de récupérer, mettre à jour le profil et changer le mot de passe.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}profile`;

  private readonly _profile = signal<User | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _updating = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly updating = this._updating.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Récupère le profil de l'utilisateur connecté.
   */
  getProfile(): Observable<User> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<User>(this.apiUrl).pipe(
      tap((profile) => {
        this._profile.set(profile);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        this._error.set(
          error.error?.message || 'Erreur lors du chargement du profil'
        );
        throw error;
      })
    );
  }

  /**
   * Met à jour le profil de l'utilisateur connecté.
   */
  updateProfile(request: UpdateProfileRequest): Observable<User> {
    this._updating.set(true);
    this._error.set(null);

    return this.http.put<User>(this.apiUrl, request).pipe(
      tap((profile) => {
        this._profile.set(profile);
        this._updating.set(false);
      }),
      catchError((error) => {
        this._updating.set(false);
        this._error.set(
          error.error?.message || 'Erreur lors de la mise à jour du profil'
        );
        throw error;
      })
    );
  }

  /**
   * Change le mot de passe de l'utilisateur connecté.
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    this._updating.set(true);
    this._error.set(null);

    return this.http.put<void>(`${this.apiUrl}/password`, request).pipe(
      tap(() => {
        this._updating.set(false);
      }),
      catchError((error) => {
        this._updating.set(false);
        this._error.set(
          error.error?.message || 'Erreur lors du changement de mot de passe'
        );
        throw error;
      })
    );
  }

  /**
   * Réinitialise l'état du service.
   */
  resetState(): void {
    this._profile.set(null);
    this._loading.set(false);
    this._updating.set(false);
    this._error.set(null);
  }
}
