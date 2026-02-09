export interface CreateChildRequest {
  lastName: string;
  firstName: string;
  email: string;
  password: string;
  birthDate: string; // Format ISO: YYYY-MM-DD
  phoneNumber?: string;
  parentId: number;
}

export interface CreateChildResponse {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  message: string;
}
