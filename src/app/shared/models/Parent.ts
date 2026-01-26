import { BookingStatus } from './Booking';

export interface Child {
  id: number;
  name: string;
  level?: string;
  email?: string;
  parent?: string;
  nextSession?: Date;
  teacher?: string;
}

export interface BookingDisplay {
  id: number;
  coursId: number;
  eleveId: number | undefined;
  child: string;
  date: Date;
  subject: string;
  teacher: string;
  price: number;
  duration: number;
  status: BookingStatus;
}

export interface SlotDisplay {
  id: number;
  date: Date;
  duration: number;
  subject: string;
  price: number;
  teacher: string;
}

export interface Payment {
  id: number;
  date: string;
  invoiceId: number;
  amount: number;
  method: string;
  status: string;
}