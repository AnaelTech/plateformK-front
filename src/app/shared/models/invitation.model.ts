import { TypeUser } from './User';

export interface InvitationRequest {
  email: string;
  targetRole: TypeUser;
  parentId?: number;
}

export interface InvitationResponse {
  message: string;
  invitationSent: boolean;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email: string;
  targetRole: TypeUser;
  expiresAt: string;
  parentId?: number;
}

export interface RegisterViaInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: number;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    typeUser: TypeUser;
    phoneNumber?: string;
    city?: string;
    address?: string;
    postalCode?: number;
    birthDate?: string;
    emailValid?: boolean;
    registrationDate?: string;
    updatedAt?: string;
  };
}
