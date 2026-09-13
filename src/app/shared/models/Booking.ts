export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface Booking {
  id: number;
  coursId: number;
  coursTitre: string;
  coursMatiere: string;
  coursDate: string; // ISO string
  coursDureeMinutes: number;
  coursTarif: number;
  parentId: number;
  parentName: string;
  eleveId: number;
  eleveName: string;
  teacherName?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  notes?: string;
  notionsCovered?: string;
  teacherFeedback?: string;
  status: BookingStatus;
  // Propriétés pour le template (rétrocompatibilité)
  child?: string;
  date?: Date;
  subject?: string;
  teacher?: string;
  price?: number;
  duration?: number;
}

export interface BookingRequest {
  coursId: number;
  eleveId: number;
  notes?: string;
}

export interface BookingUpdateRequest {
  status?: BookingStatus;
  notes?: string;
}

export interface CompleteBookingRequest {
  notionsCovered?: string;
  teacherFeedback: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}