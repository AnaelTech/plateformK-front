// src/app/core/auth/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, concatMap, map, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { environment } from '../../../../environments/environment.development';
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  StoredTokens,
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

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
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
      throw new Error('No refresh token available');
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, request)
      .pipe(tap((response) => this.saveTokens(response)));
  }

  logout(path: string = '/'): void {
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

    try {
      const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
      tokens.expiresAt = payload.exp * 1000;
    } catch (e) {
      console.error('Failed to decode token', e);
    }

    localStorage.setItem(this.tokenKey, tokens.accessToken);
    localStorage.setItem(this.refreshTokenKey, tokens.refreshToken);
    if (tokens.expiresAt) {
      localStorage.setItem('token_expires_at', tokens.expiresAt.toString());
    }
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
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
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

  private clearTokensAndNavigate(path: string): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem('token_expires_at');
    this.userService.clearCache();
    this.router.navigate([path]);
  }
}
