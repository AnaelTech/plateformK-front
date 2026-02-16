import { BookingStatus } from '../models/Booking';
import { CoursStatus } from '../models/Cours';

export type StatusType = BookingStatus | CoursStatus | InvoiceStatus | string;

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface StatusConfig {
  color: string;
  label: string;
  icon?: string;
}

type StatusConfigMap = Record<string, StatusConfig>;

const BOOKING_STATUS_CONFIG: StatusConfigMap = {
  [BookingStatus.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'En attente',
    icon: 'clock',
  },
  [BookingStatus.CONFIRMED]: {
    color: 'bg-green-100 text-green-800',
    label: 'Confirmé',
    icon: 'check-circle',
  },
  [BookingStatus.COMPLETED]: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Terminé',
    icon: 'check',
  },
  [BookingStatus.CANCELLED]: {
    color: 'bg-red-100 text-red-800',
    label: 'Annulé',
    icon: 'x-circle',
  },
  MISSED: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Manqué',
    icon: 'x',
  },
};

const COURS_STATUS_CONFIG: StatusConfigMap = {
  [CoursStatus.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'En attente',
    icon: 'clock',
  },
  [CoursStatus.CONFIRMED]: {
    color: 'bg-green-100 text-green-800',
    label: 'Confirmé',
    icon: 'check-circle',
  },
  [CoursStatus.COMPLETED]: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Terminé',
    icon: 'check',
  },
  [CoursStatus.CANCELLED]: {
    color: 'bg-red-100 text-red-800',
    label: 'Annulé',
    icon: 'x-circle',
  },
};

const INVOICE_STATUS_CONFIG: StatusConfigMap = {
  [InvoiceStatus.DRAFT]: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Brouillon',
    icon: 'document',
  },
  [InvoiceStatus.SENT]: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Envoyée',
    icon: 'mail',
  },
  [InvoiceStatus.PAID]: {
    color: 'bg-green-100 text-green-800',
    label: 'Payée',
    icon: 'check-circle',
  },
  [InvoiceStatus.OVERDUE]: {
    color: 'bg-red-100 text-red-800',
    label: 'En retard',
    icon: 'alert-triangle',
  },
  [InvoiceStatus.CANCELLED]: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Annulée',
    icon: 'x-circle',
  },
};

const ADDITIONAL_STATUS_CONFIG: StatusConfigMap = {
  UPCOMING: {
    color: 'bg-blue-100 text-blue-800',
    label: 'À venir',
    icon: 'calendar',
  },
  failed: {
    color: 'bg-red-100 text-red-800',
    label: 'Échoué',
    icon: 'x-circle',
  },
  ACTIVE: {
    color: 'bg-green-100 text-green-800',
    label: 'Actif',
    icon: 'check-circle',
  },
  INACTIVE: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Inactif',
    icon: 'minus-circle',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  color: 'bg-gray-100 text-gray-800',
  label: 'Inconnu',
  icon: 'help-circle',
};

const ALL_STATUS_CONFIG: StatusConfigMap = {
  ...BOOKING_STATUS_CONFIG,
  ...COURS_STATUS_CONFIG,
  ...INVOICE_STATUS_CONFIG,
  ...ADDITIONAL_STATUS_CONFIG,
};

export function normalizeStatus(status: StatusType): string {
  if (!status) return '';
  if (
    status === BookingStatus.PENDING ||
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.COMPLETED ||
    status === BookingStatus.CANCELLED ||
    status === CoursStatus.PENDING ||
    status === CoursStatus.CONFIRMED ||
    status === CoursStatus.COMPLETED ||
    status === CoursStatus.CANCELLED ||
    Object.values(InvoiceStatus).includes(status as InvoiceStatus)
  ) {
    return status;
  }
  const upperStatus = status.toUpperCase();
  const matchedKey = Object.keys(ALL_STATUS_CONFIG).find(
    (key) => key.toUpperCase() === upperStatus
  );
  return matchedKey || status;
}

export function getStatusConfig(status: StatusType): StatusConfig {
  const normalizedStatus = normalizeStatus(status);
  return ALL_STATUS_CONFIG[normalizedStatus] ?? DEFAULT_CONFIG;
}

export function getStatusColor(status: StatusType): string {
  return getStatusConfig(status).color;
}

export function getStatusLabel(status: StatusType): string {
  return getStatusConfig(status).label;
}

export function getStatusIcon(status: StatusType): string | undefined {
  return getStatusConfig(status).icon;
}

export function isBookingStatus(status: StatusType): status is BookingStatus {
  return Object.values(BookingStatus).includes(status as BookingStatus);
}

export function isCoursStatus(status: StatusType): status is CoursStatus {
  return Object.values(CoursStatus).includes(status as CoursStatus);
}

export function isInvoiceStatus(status: StatusType): status is InvoiceStatus {
  return Object.values(InvoiceStatus).includes(status as InvoiceStatus);
}

export function isUpcomingStatus(status: StatusType): boolean {
  const normalized = normalizeStatus(status);
  return normalized === BookingStatus.PENDING || normalized === BookingStatus.CONFIRMED;
}

export function isPastStatus(status: StatusType): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized === BookingStatus.COMPLETED ||
    normalized === BookingStatus.CANCELLED ||
    normalized === 'MISSED'
  );
}

export function isActiveStatus(status: StatusType): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized === BookingStatus.PENDING ||
    normalized === BookingStatus.CONFIRMED ||
    normalized === CoursStatus.PENDING ||
    normalized === CoursStatus.CONFIRMED
  );
}

export function isCancelledStatus(status: StatusType): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized === BookingStatus.CANCELLED ||
    normalized === CoursStatus.CANCELLED ||
    normalized === InvoiceStatus.CANCELLED ||
    normalized === 'MISSED'
  );
}

export function getBookingStatusConfig(): StatusConfigMap {
  return { ...BOOKING_STATUS_CONFIG };
}

export function getCoursStatusConfig(): StatusConfigMap {
  return { ...COURS_STATUS_CONFIG };
}

export function getInvoiceStatusConfig(): StatusConfigMap {
  return { ...INVOICE_STATUS_CONFIG };
}

export function getAllStatusConfig(): StatusConfigMap {
  return { ...ALL_STATUS_CONFIG };
}

export const StatusUtils = {
  normalizeStatus,
  getStatusConfig,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
  isBookingStatus,
  isCoursStatus,
  isInvoiceStatus,
  isUpcomingStatus,
  isPastStatus,
  isActiveStatus,
  isCancelledStatus,
  getBookingStatusConfig,
  getCoursStatusConfig,
  getInvoiceStatusConfig,
  getAllStatusConfig,
};