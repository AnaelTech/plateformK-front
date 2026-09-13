import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService } from '../../services/notification.service';
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
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
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
export class ToastComponent {
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
