import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService, type ToastNotification } from '../../services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Toast Component
 * 
 * Displays toast notifications using Angular Signals.
 * Standalone component with animations.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class Toast {
  private notificationService = inject(NotificationService);
  
  // Signal from notification service
  toasts = this.notificationService.toasts;

  /**
   * Close a specific toast
   */
  close(id: string): void {
    this.notificationService.remove(id);
  }

  /**
   * Execute the toast action and close it.
   */
  handleAction(toast: ToastNotification): void {
    toast.action?.handler();
    this.close(toast.id);
  }

  /**
   * Get icon for toast type
   */
  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || 'ℹ';
  }
}
