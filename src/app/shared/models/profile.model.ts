/**
 * Modèles pour la gestion du profil utilisateur
 */

/**
 * Requête pour mettre à jour le profil
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: number;
  birthDate?: string;
}

/**
 * Requête pour changer le mot de passe
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Réponse du profil utilisateur
 */
export interface ProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: number;
  birthDate?: string;
  emailValid: boolean;
  typeUser: string;
  registrationDate: string;
  updatedAt: string;
}
