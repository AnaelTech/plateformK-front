import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  Notification,
  NotificationStatus,
  getNotificationIcon,
  getNotificationColor,
  getRelativeTime,
} from '../../models/notification.model';

/**
 * Notification Item Component
 * Displays a single notification with action buttons
 */
@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
  @Input({ required: true }) notification!: Notification;
  @Output() markAsRead = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  @Output() navigate = new EventEmitter<void>();

  private readonly router = inject(Router);

  // Computed properties
  readonly isUnread = computed(
    () => this.notification.status === NotificationStatus.UNREAD,
  );

  readonly icon = computed(() => getNotificationIcon(this.notification.type));
  readonly colorClass = computed(() =>
    getNotificationColor(this.notification.type),
  );
  readonly relativeTime = computed(() =>
    getRelativeTime(this.notification.createdAt),
  );

  /**
   * Handle notification click - navigate if action URL exists
   */
  onNotificationClick(): void {
    // Mark as read if unread
    if (this.notification.status === NotificationStatus.UNREAD) {
      this.markAsRead.emit(this.notification.id);
    }

    // Navigate if action URL exists
    if (this.notification.actionUrl) {
      this.navigate.emit();
      // Use navigateByUrl to correctly handle full paths like '/dashboard/booking/123'
      this.router.navigateByUrl(this.notification.actionUrl);
    }
  }

  /**
   * Handle mark as read button click
   */
  onMarkAsReadClick(event: Event): void {
    event.stopPropagation();
    this.markAsRead.emit(this.notification.id);
  }

  /**
   * Handle delete button click
   */
  onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.notification.id);
  }

  /**
   * Get background class based on read status
   */
  getBackgroundClass(): string {
    return this.notification.status === NotificationStatus.UNREAD
      ? 'bg-blue-50 hover:bg-blue-100'
      : 'bg-white hover:bg-gray-50';
  }
}
