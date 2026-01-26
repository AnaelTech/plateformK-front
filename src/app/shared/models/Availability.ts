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

export interface CreateAvailabilityRequest {
  teacherId: number;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  subject: string;
  price: number;
}

export interface AvailabilityFormData {
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  subject: string;
  price: number;
}

export interface UpdateAvailabilityRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  subject?: string;
  price?: number;
  isAvailable?: boolean;
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