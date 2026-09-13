/**
 * Modèles de vue pour la gestion des créneaux.
 * Les disponibilités sont des CoursSession (cours sans réservation) côté backend.
 * Ces interfaces servent uniquement à l'affichage et au formulaire du frontend.
 */

export interface Availability {
  id: number;
  teacherId: number;
  teacherName: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  durationMinutes: number;
  subject: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityFormData {
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  subject: string;
  price: number;
}

export interface AvailabilitySlot {
  id: number;
  teacherId: number;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  subject: string;
  price: number;
}
