// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
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
  token: string;
  type: string; // "Bearer"
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'auth';
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  // Inscription
  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  // Connexion
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          this.saveToken(response.token);
          // Optionnel : tu peux récupérer les infos user ici ou via un endpoint /me
        })
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
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }

  // Optionnel : sauvegarder des infos utilisateur
  saveUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }
}
