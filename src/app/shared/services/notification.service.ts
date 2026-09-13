import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  timestamp: number;
}

/**
 * Notification Service using Angular Signals
 *
 * Modern Angular 19 approach for toast notifications without external dependencies.
 * Uses signals for optimal change detection and reactivity.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly MAX_TOASTS = 5;
  private readonly DEFAULT_DURATION = 3000; // 3 seconds

  // Signal for reactive toast list
  private toastsSignal = signal<Toast[]>([]);

  // Readonly computed signal for external consumption
  readonly toasts = this.toastsSignal.asReadonly();

  /**
   * Show a success notification
   */
  success(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.addToast(message, 'success', duration);
  }

  /**
   * Show an error notification
   */
  error(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.addToast(message, 'error', duration);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.addToast(message, 'warning', duration);
  }

  /**
   * Show an info notification
   */
  info(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.addToast(message, 'info', duration);
  }

  /**
   * Remove a specific toast by ID
   */
  remove(id: string): void {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toastsSignal.set([]);
  }

  /**
   * Add a new toast to the queue
   */
  private addToast(message: string, type: ToastType, duration: number): void {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration,
      timestamp: Date.now(),
    };

    // Add toast and limit to MAX_TOASTS
    this.toastsSignal.update((toasts) => {
      const updated = [...toasts, toast];
      return updated.slice(-this.MAX_TOASTS); // Keep only last N toasts
    });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }
  }

  /**
   * Generate unique ID for toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
