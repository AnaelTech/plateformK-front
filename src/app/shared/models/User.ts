export enum TypeUser {
  PARENT = 'PARENT',
  ELEVE = 'ELEVE',
  PROFESSEUR = 'PROFESSEUR'
}

export interface User {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  registrationDate: string;
  birthDate: string;
  phoneNumber: string;
  city: string;
  address: string;
  postalCode: number;
  emailValid: boolean;
  updatedAt: string;
  typeUser: TypeUser;
  enfants?: User[];
  parents?: User[];
}

export interface UserRequest {
  lastName?: string;
  firstName?: string;
  email?: string;
  password?: string;
  birthDate?: string;
  phoneNumber?: string;
  city?: string;
  address?: string;
  postalCode?: number;
  typeUser?: TypeUser;
}
