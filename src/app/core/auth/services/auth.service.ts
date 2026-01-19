// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, concatMap, map } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { environment } from '../../../../environments/environment.development';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  birthDate?: string; // format YYYY-MM-DD
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string; // "Bearer"
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl + '/auth';
  private readonly tokenKey = 'auth_token';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly userService: UserService
  ) {}

  // Inscription
  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // Connexion
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => this.saveToken(response.accessToken)),
        concatMap((response) =>
          this.userService.getCurrentUser().pipe(
            map(() => response)
          )
        )
      );
  }

  // Sauvegarde du token
  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    const token = this.getToken();
    return token != null && !this.isTokenExpired(token);
  }

  // Vérifier l'expiration du token (décodage simple)
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // Déconnexion
  logout(path: string = '/'): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate([path]);
  }
}
