import { Component, inject, computed } from '@angular/core';

import { Router } from '@angular/router';
import { SettingsService } from '../../shared/services/settings.service';
import { WebSocketNotificationService } from '../../shared/services/websocket-notification.service';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { getInitials } from '../../shared/utils/string.utils';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './components/settings.component.html',
})
export class SettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly websocket = inject(WebSocketNotificationService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly user = this.userService.currentUser;

  readonly darkMode = this.settings.darkMode;
  readonly browserNotifications = this.settings.browserNotifications;
  readonly realtimeNotifications = this.settings.realtimeNotifications;
  readonly wsConnected = this.websocket.connected;

  readonly userInitials = computed(() => {
    const u = this.user();
    return u ? getInitials(`${u.firstName} ${u.lastName}`) : '';
  });

  toggleDarkMode(): void {
    this.settings.toggleDarkMode();
  }

  toggleBrowserNotifications(): void {
    const enabled = !this.browserNotifications();
    if (enabled) {
      this.websocket.requestNotificationPermission();
    }
    this.settings.setBrowserNotifications(enabled);
  }

  toggleRealtimeNotifications(): void {
    // La connexion/déconnexion est gérée par l'effet du service WebSocket
    this.settings.setRealtimeNotifications(!this.realtimeNotifications());
  }

  goProfile(): void {
    this.router.navigate(['/profile']);
  }

  goBack(): void {
    const currentUser = this.user();
    if (currentUser) {
      const routesByRole: Record<string, string> = {
        PROFESSEUR: '/dashboard',
        PARENT: '/parent-dashboard',
        ELEVE: '/student-dashboard',
      };
      this.router.navigate([routesByRole[currentUser.typeUser] ?? '/']);
    } else {
      this.router.navigate(['/']);
    }
  }

  logout(): void {
    this.userService.clearCache();
    this.authService.logout('/');
  }
}