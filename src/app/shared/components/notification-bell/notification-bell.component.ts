import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';

import { NotificationApiService } from '../../services/notification-api.service';
import { WebSocketNotificationService } from '../../services/websocket-notification.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

/**
 * Notification Bell Component
 * Displays a bell icon with an unread count badge
 * Toggles notification panel on click
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [NotificationPanelComponent],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly notificationApi = inject(NotificationApiService);
  private readonly webSocketService = inject(WebSocketNotificationService);

  // Component state
  readonly isPanelOpen = signal<boolean>(false);
  readonly unreadCount = computed(() => this.notificationApi.unreadCount());
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor() {
    // Load initial unread count
    this.notificationApi.refreshUnreadCount();

    // React to new notifications from WebSocket
    effect(() => {
      const latestNotification = this.webSocketService.latestNotification();
      
      if (latestNotification) {
        // Add to local cache
        this.notificationApi.addNotificationToCache(latestNotification);
        
        // Clear from WebSocket service
        this.webSocketService.clearLatestNotification();
        
        // Auto-open panel for important notifications (optional)
        // this.isPanelOpen.set(true);
      }
    });
  }

  /**
   * Toggle notification panel
   */
  togglePanel(): void {
    this.isPanelOpen.update((open) => !open);
    
    // Load unread notifications when opening
    if (this.isPanelOpen()) {
      this.notificationApi.refreshNotifications();
    }
  }

  /**
   * Close panel
   */
  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  /**
   * Get display count (show 99+ if count exceeds 99)
   */
  getDisplayCount(): string {
    const count = this.unreadCount();
    return count > 99 ? '99+' : count.toString();
  }

  /**
   * Request browser notification permission (must be called from user action)
   */
  enableBrowserNotifications(): void {
    this.webSocketService.requestNotificationPermission();
  }
}
