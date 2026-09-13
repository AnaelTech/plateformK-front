import {
  ChangeDetectionStrategy,
  Component,
  Output,
  EventEmitter,
  inject,
  computed,
} from '@angular/core';

import { NotificationApiService } from '../../services/notification-api.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';

/**
 * Notification Panel Component
 * Dropdown panel displaying recent notifications
 */
@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [NotificationItemComponent],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPanelComponent {
  @Output() buttonClose = new EventEmitter<void>();

  private readonly notificationApi = inject(NotificationApiService);

  // Computed signals
  readonly notifications = computed(() => this.notificationApi.notifications());
  readonly loading = computed(() => this.notificationApi.loading());
  readonly error = computed(() => this.notificationApi.error());
  readonly hasNotifications = computed(() => this.notifications().length > 0);
  readonly unreadCount = computed(() => this.notificationApi.unreadCount());

  /**
   * Mark a notification as read
   */
  onMarkAsRead(notificationId: number): void {
    this.notificationApi.markAsRead(notificationId).subscribe({
      error: (err) =>
        console.error('Failed to mark notification as read:', err),
    });
  }

  /**
   * Delete a notification
   */
  onDelete(notificationId: number): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationApi.deleteNotification(notificationId).subscribe({
        error: (err) => console.error('Failed to delete notification:', err),
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  onMarkAllAsRead(): void {
    this.notificationApi.markAllAsRead().subscribe({
      error: (err) => console.error('Failed to mark all as read:', err),
    });
  }

  /**
   * Handle notification navigation (close panel)
   */
  onNotificationNavigate(): void {
    this.buttonClose.emit();
  }

  /**
   * Close panel
   */
  onClose(): void {
    this.buttonClose.emit();
  }
}
