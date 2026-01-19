export enum CoursStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Cours {
  id: number;
  titre: string;
  matiere: string;
  dureeMinutes: number;
  dateCours: string;
  notionsAbordees: string;
  tarif: number;
  parentId: number;
  eleveId?: number;
  invoiceId?: number;
  statut: CoursStatus;
}

export interface CreateCoursRequest {
  titre: string;
  matiere: string;
  dureeMinutes: number;
  dateCours: string;
  notionsAbordees: string;
  tarif: number;
  parentId: number;
  eleveId?: number;
  statut: CoursStatus;
}

export interface UpdateCoursRequest {
  titre?: string;
  matiere?: string;
  dureeMinutes?: number;
  dateCours?: string; // ISO string
  notionsAbordees?: string;
  tarif?: number;
  parentId?: number;
  eleveId?: number;
  statut?: CoursStatus;
}

export interface AssignEleveRequest {
  eleveId?: number;
}
