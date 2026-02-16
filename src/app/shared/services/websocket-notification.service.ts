import { Injectable, inject, signal, effect } from '@angular/core';
import { Client, IMessage, StompSubscription, Frame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { Notification as AppNotification } from '../models/notification.model';

/**
 * WebSocket Notification Service
 * Manages real-time notification delivery using STOMP over WebSocket
 */
@Injectable({
  providedIn: 'root',
})
export class WebSocketNotificationService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  private stompClient: Client | null = null;
  private subscription: StompSubscription | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000; // 3 seconds

  // Signals for reactive state management
  private readonly _connected = signal<boolean>(false);
  private readonly _latestNotification = signal<AppNotification | null>(null);
  private readonly _error = signal<string | null>(null);

  // Read-only signals exposed to components
  readonly connected = this._connected.asReadonly();
  readonly latestNotification = this._latestNotification.asReadonly();
  readonly error = this._error.asReadonly();

  // WebSocket endpoint - construct base URL properly
  private readonly wsEndpoint = (() => {
    const baseUrl = environment.apiUrl
      .replace('/api/v1/', '')
      .replace('/api/v1', '');
    return baseUrl.endsWith('/') ? `${baseUrl}ws` : `${baseUrl}/ws`;
  })();

  constructor() {
    // Auto-connect when user is authenticated
    effect(() => {
      const user = this.userService.currentUser();
      const isLoggedIn = this.authService.isLoggedIn();

      if (user && isLoggedIn && !this._connected()) {
        this.connect();
      } else if (!isLoggedIn && this._connected()) {
        this.disconnect();
      }
    });
  }

  /**
   * Connect to WebSocket server with JWT authentication
   */
  connect(): void {
    if (this._connected() || this.stompClient?.connected) {
      //console.log('[WebSocket] Already connected');
      return;
    }

    const token = this.authService.getToken();
    const user = this.userService.currentUser();

    if (!token || !user) {
      //console.error('[WebSocket] Cannot connect: Missing token or user');
      this._error.set('Authentication required');
      return;
    }

    //console.log('[WebSocket] Connecting to', this.wsEndpoint);
    this._error.set(null);

    // Create SockJS socket
    const socket = new SockJS(this.wsEndpoint);

    // Create STOMP client
    this.stompClient = new Client({
      webSocketFactory: () => socket as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {
        //console.log('[WebSocket Debug]', str);
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => this.onConnect(user.id),
      onDisconnect: () => this.onDisconnect(),
      onStompError: (frame) => this.onError(frame),
      onWebSocketError: () => this.onWebSocketError(),
    });

    // Activate the client
    this.stompClient.activate();
  }

  /**
   * Handle successful connection
   */
  private onConnect(userId: number): void {
    //console.log('[WebSocket] Connected successfully');
    this._connected.set(true);
    this._error.set(null);
    this.reconnectAttempts = 0;

    // Subscribe to user-specific notification queue
    const destination = `/user/${userId}/queue/notifications`;
    console.log('[WebSocket] Subscribing to', destination);

    // Use setTimeout to ensure STOMP client is fully ready
    setTimeout(() => {
      if (this.stompClient && this.stompClient.connected) {
        this.subscription = this.stompClient.subscribe(
          destination,
          (message: IMessage) => this.onNotificationReceived(message),
        );
      }
    }, 100);
  }

  /**
   * Handle disconnection
   */
  private onDisconnect(): void {
    //console.log('[WebSocket] Disconnected');
    this._connected.set(false);

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Handle STOMP errors
   */
  private onError(frame: Frame): void {
    //console.error('[WebSocket] STOMP error', frame);
    this._error.set(
      'Connection error: ' + (frame.headers?.['message'] || 'Unknown error'),
    );
    this._connected.set(false);

    // Attempt reconnection
    this.attemptReconnect();
  }

  /**
   * Handle WebSocket errors
   */
  private onWebSocketError(): void {
    //console.error('[WebSocket] WebSocket error', event);
    this._error.set('WebSocket error');
    this._connected.set(false);

    // Attempt reconnection
    this.attemptReconnect();
  }

  /**
   * Handle incoming notification message
   */
  private onNotificationReceived(message: IMessage): void {
    try {
      const notification: AppNotification = JSON.parse(message.body);
      //console.log('[WebSocket] Notification received', notification);

      // Update latest notification signal
      this._latestNotification.set(notification);

      // Optional: Play sound or show browser notification
      this.showBrowserNotification(notification);
    } catch {
      //console.error('[WebSocket] Failed to parse notification', error);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      //console.error('[WebSocket] Max reconnect attempts reached');
      this._error.set('Failed to reconnect. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    //console.log(
    // `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    //);

    setTimeout(() => {
      if (!this._connected() && this.authService.isLoggedIn()) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Show browser notification (requires user permission)
   */
  private showBrowserNotification(notification: AppNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/logo.png', // Update with your app icon
        tag: notification.id.toString(),
      });
    }
  }

  /**
   * Request browser notification permission
   */
  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(() => {
        //console.log('[WebSocket] Notification permission:', permission);
      });
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient?.connected) {
      //console.log('[WebSocket] Disconnecting...');
      this.stompClient.deactivate();
    }

    this._connected.set(false);
    this._latestNotification.set(null);
    this._error.set(null);
    this.reconnectAttempts = 0;
  }

  /**
   * Manually reconnect
   */
  reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  /**
   * Clear latest notification (mark as consumed)
   */
  clearLatestNotification(): void {
    this._latestNotification.set(null);
  }
}
