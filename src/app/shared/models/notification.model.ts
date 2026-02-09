/**
 * Notification Types - Must match backend enum
 */
export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  NEW_AVAILABILITY = 'NEW_AVAILABILITY',
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_DUE_SOON = 'INVOICE_DUE_SOON',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  INVOICE_PAID = 'INVOICE_PAID',
  COURS_REMINDER = 'COURS_REMINDER',
  COURS_COMPLETED = 'COURS_COMPLETED',
  GENERAL = 'GENERAL'
}

/**
 * Notification Status - Must match backend enum
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Main Notification interface - Must match backend NotificationResponse DTO
 */
export interface Notification {
  id: number;
  recipientId: number;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  actionUrl?: string;
}

/**
 * Notification statistics - Must match backend NotificationStats DTO
 */
export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  archivedCount: number;
}

/**
 * Request payload for creating a notification (admin only)
 */
export interface NotificationRequest {
  recipientId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  actionUrl?: string;
}

/**
 * Pagination response wrapper
 */
export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Helper function to get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.BOOKING_CONFIRMED:
      return 'check-circle';
    case NotificationType.BOOKING_CANCELLED:
      return 'x-circle';
    case NotificationType.NEW_AVAILABILITY:
      return 'calendar';
    case NotificationType.INVOICE_CREATED:
      return 'file-text';
    case NotificationType.INVOICE_DUE_SOON:
      return 'clock';
    case NotificationType.INVOICE_OVERDUE:
      return 'alert-triangle';
    case NotificationType.INVOICE_PAID:
      return 'dollar-sign';
    case NotificationType.COURS_REMINDER:
      return 'bell';
    case NotificationType.COURS_COMPLETED:
      return 'check';
    case NotificationType.GENERAL:
      return 'info';
    default:
      return 'bell';
  }
}

/**
 * Helper function to get notification color class based on type
 */
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.BOOKING_CONFIRMED:
    case NotificationType.INVOICE_PAID:
    case NotificationType.COURS_COMPLETED:
      return 'text-green-600';
    case NotificationType.BOOKING_CANCELLED:
    case NotificationType.INVOICE_OVERDUE:
      return 'text-red-600';
    case NotificationType.NEW_AVAILABILITY:
    case NotificationType.INVOICE_CREATED:
      return 'text-blue-600';
    case NotificationType.INVOICE_DUE_SOON:
    case NotificationType.COURS_REMINDER:
      return 'text-yellow-600';
    case NotificationType.GENERAL:
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Helper function to format relative time
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
