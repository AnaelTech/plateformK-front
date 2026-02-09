import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Notification,
  NotificationPage,
  NotificationStats,
  NotificationType,
  NotificationStatus,
} from '../models/notification.model';
import { environment } from '../../../environments/environment';

/**
 * Notification API Service
 * Handles REST API calls for notification management
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}notifications`;

  // Signals for reactive state management
  private readonly _unreadCount = signal<number>(0);
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Read-only signals exposed to components
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Get paginated notifications
   */
  getNotifications(
    page: number = 0,
    size: number = 20,
    status?: NotificationStatus
  ): Observable<NotificationPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<NotificationPage>(this.apiUrl, { params })
      .pipe(
        tap({
          next: (response) => {
            this._notifications.set(response.content);
            this._loading.set(false);
          },
          error: (error) => {
            this._error.set(error.message || 'Failed to load notifications');
            this._loading.set(false);
          },
        })
      );
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<Notification[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Notification[]>(`${this.apiUrl}/unread`)
      .pipe(
        tap({
          next: (notifications) => {
            this._notifications.set(notifications);
            this._unreadCount.set(notifications.length);
            this._loading.set(false);
          },
          error: (error) => {
            this._error.set(error.message || 'Failed to load unread notifications');
            this._loading.set(false);
          },
        })
      );
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<number> {
    return this.http
      .get<number>(`${this.apiUrl}/unread/count`)
      .pipe(
        tap((count) => this._unreadCount.set(count))
      );
  }

  /**
   * Get notification statistics
   */
  getStats(): Observable<NotificationStats> {
    return this.http.get<NotificationStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(
    type: NotificationType,
    page: number = 0,
    size: number = 20
  ): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<NotificationPage>(`${this.apiUrl}/type/${type}`, { params })
      .pipe(
        tap({
          next: (response) => {
            this._notifications.set(response.content);
            this._loading.set(false);
          },
          error: (error) => {
            this._error.set(error.message || 'Failed to load notifications by type');
            this._loading.set(false);
          },
        })
      );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: number): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.apiUrl}/${id}/read`, {})
      .pipe(
        tap((notification) => {
          // Update local cache
          this._notifications.update((notifications) =>
            notifications.map((n) =>
              n.id === id ? notification : n
            )
          );

          // Decrement unread count if status changed
          if (notification.status === NotificationStatus.READ) {
            this._unreadCount.update((count) => Math.max(0, count - 1));
          }
        })
      );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http
      .patch<void>(`${this.apiUrl}/read-all`, {})
      .pipe(
        tap(() => {
          // Update local cache
          this._notifications.update((notifications) =>
            notifications.map((n) => ({
              ...n,
              status: NotificationStatus.READ,
              readAt: new Date().toISOString(),
            }))
          );

          // Reset unread count
          this._unreadCount.set(0);
        })
      );
  }

  /**
   * Archive a notification
   */
  archiveNotification(id: number): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.apiUrl}/${id}/archive`, {})
      .pipe(
        tap((notification) => {
          // Update local cache
          this._notifications.update((notifications) =>
            notifications.map((n) =>
              n.id === id ? notification : n
            )
          );
        })
      );
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          // Remove from local cache
          this._notifications.update((notifications) =>
            notifications.filter((n) => n.id !== id)
          );

          // Update unread count if the deleted notification was unread
          const deletedNotification = this._notifications().find((n) => n.id === id);
          if (deletedNotification?.status === NotificationStatus.UNREAD) {
            this._unreadCount.update((count) => Math.max(0, count - 1));
          }
        })
      );
  }

  /**
   * Refresh unread count (call periodically or after important actions)
   */
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }

  /**
   * Refresh notification list
   */
  refreshNotifications(): void {
    this.getUnreadNotifications().subscribe();
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this._notifications.set([]);
    this._unreadCount.set(0);
    this._error.set(null);
  }

  /**
   * Add a new notification to the local cache (called by WebSocket service)
   */
  addNotificationToCache(notification: Notification): void {
    this._notifications.update((notifications) => [notification, ...notifications]);
    
    if (notification.status === NotificationStatus.UNREAD) {
      this._unreadCount.update((count) => count + 1);
    }
  }
}
