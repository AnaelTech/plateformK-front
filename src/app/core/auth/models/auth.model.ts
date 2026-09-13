import { User } from '../../../shared/models/User';

/**
 * Réponse d'authentification du backend
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

/**
 * Réponse d'inscription du backend
 */
export interface RegisterResponse {
  id: number;
  email: string;
  message: string;
}

/**
 * Requête de login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Requête de refresh token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Tokens stockés localement
 */
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}
