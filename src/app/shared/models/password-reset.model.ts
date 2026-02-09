/**
 * Modèles pour la réinitialisation de mot de passe
 */

/**
 * Requête pour demander un reset de mot de passe
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Requête pour confirmer le reset avec le nouveau mot de passe
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

/**
 * Réponse de validation du token
 */
export interface TokenValidationResponse {
  valid: boolean;
  email?: string;
  message?: string;
}
