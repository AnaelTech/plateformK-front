// src/app/core/auth/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, concatMap, map, BehaviorSubject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { environment } from '../../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  StoredTokens,
  RegisterResponse,
} from '../models/auth.model';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  birthDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  private readonly apiUrl = environment.apiUrl + 'auth';
  private readonly tokenKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => this.saveTokens(response)),
        concatMap((response) =>
          this.userService.getCurrentUser().pipe(map(() => response)),
        ),
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, request)
      .pipe(tap((response) => this.saveTokens(response)));
  }

  logout(path = '/'): void {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      const request: RefreshTokenRequest = { refreshToken };
      this.http.post(`${this.apiUrl}/logout`, request).subscribe({
        next: () => this.clearTokensAndNavigate(path),
        error: () => this.clearTokensAndNavigate(path),
      });
    } else {
      this.clearTokensAndNavigate(path);
    }
  }

  private saveTokens(response: AuthResponse): void {
    const tokens: StoredTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };

    const payload = this.decodeJwtPayload(response.accessToken);
    if (payload?.exp) {
      tokens.expiresAt = payload.exp * 1000;
    }

    localStorage.setItem(this.tokenKey, tokens.accessToken);
    localStorage.setItem(this.refreshTokenKey, tokens.refreshToken);
    if (tokens.expiresAt) {
      localStorage.setItem('token_expires_at', tokens.expiresAt.toString());
    }
  }

  /**
   * Décode la partie payload d'un JWT (encodage base64url, non standard).
   * Retourne null si le token est malformé.
   */
  private decodeJwtPayload(token: string): { exp?: number } | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        return null;
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = (4 - (base64.length % 4)) % 4;
      const padded = base64 + '='.repeat(padding);
      return JSON.parse(atob(padded));
    } catch (e) {
      console.error('Failed to decode token', e);
      return null;
    }
  }

  /**
   * Méthode publique pour sauvegarder les tokens après inscription via invitation.
   * Remplace l'écriture directe dans localStorage dans les composants externes.
   */
  handlePostRegistration(response: AuthResponse): void {
    this.saveTokens(response);
    this.userService.refreshCurrentUser();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token != null && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload?.exp) {
      return true;
    }
    return payload.exp * 1000 < Date.now();
  }

  getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  setIsRefreshing(value: boolean): void {
    this.isRefreshing = value;
  }

  getRefreshTokenSubject(): BehaviorSubject<string | null> {
    return this.refreshTokenSubject;
  }

  /**
   * Réinitialise le subject de rafraîchissement après un échec (le subject
   * précédent ayant été terminé par erreur). Évite que les futures requêtes
   * en attente héritent d'un subject mort.
   */
  resetRefreshTokenSubject(): void {
    this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
  }

  private clearTokensAndNavigate(path: string): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem('token_expires_at');
    this.userService.clearCache();
    this.router.navigate([path]);
  }
}
