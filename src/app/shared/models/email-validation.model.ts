/**
 * Modèles pour la validation d'email
 */

/**
 * Requête pour valider le code email
 */
export interface EmailValidationConfirmRequest {
  code: string;
}

/**
 * Réponse du statut de validation email
 */
export interface EmailValidationStatus {
  emailValid: boolean;
  email: string;
}
