export enum CoursStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CoursSession {
  id: number;
  titre: string;
  matiere: string;
  dureeMinutes: number;
  sessionDate: string;
  notionsAbordees?: string;   // Notions couvertes pendant le cours
  tarif: number;
  teacherId: number;        // The teacher who created the slot
  teacherName?: string;     // Teacher display name
  parentId?: number;        // The parent who booked (from booking, null if not booked)
  eleveId?: number;         // The student (from booking, null if not booked)
  invoiceId?: number;
  statut: CoursStatus;
  isAvailable?: boolean;    // Indicates if slot is available for booking
  bookingId?: number;       // Reference to booking if reserved
  createdAt?: string;       // ISO string
  updatedAt?: string;       // ISO string
}

export interface CreateCoursRequest {
  titre: string;
  matiere: string;
  dureeMinutes: number;
  sessionDate: string;
  notionsAbordees?: string; // Notions prévues pour ce cours
  tarif: number;
  teacherId: number;        // Renamed from parentId - the teacher creating the slot
  eleveId?: number;         // Elève optionnel à la création
  statut: CoursStatus;
}

export interface UpdateCoursRequest {
  titre?: string;
  matiere?: string;
  dureeMinutes?: number;
  sessionDate?: string; // ISO string
  notionsAbordees?: string; // Notions abordées (mise à jour après le cours)
  tarif?: number;
  teacherId?: number;       // Renamed from parentId
  eleveId?: number;
  statut?: CoursStatus;
}

/**
 * Cours terminé non facturé, utilisé pour la sélection lors de la création de facture.
 */
export interface CompletedUnbilledCours {
  coursId: number;
  titre: string;
  matiere: string;
  dureeMinutes: number;
  sessionDate: string;
  tarif: number;
  eleveId: number;
  eleveName: string;
  parentId: number;
  parentName: string;
  parentEmail: string;
  notionsCovered?: string;
  teacherFeedback?: string;
}
