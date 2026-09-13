import { Injectable, signal } from '@angular/core';

/**
 * Service de préférences applicatives (thème, notifications).
 * Les préférences sont persistées dans le localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private static readonly THEME_KEY = 'klassio-theme';
  private static readonly BROWSER_NOTIF_KEY = 'klassio-browser-notif';
  private static readonly REALTIME_NOTIF_KEY = 'klassio-realtime-notif';

  readonly darkMode = signal<boolean>(this.readStoredTheme());
  readonly browserNotifications = signal<boolean>(
    localStorage.getItem(SettingsService.BROWSER_NOTIF_KEY) !== 'off',
  );
  readonly realtimeNotifications = signal<boolean>(
    localStorage.getItem(SettingsService.REALTIME_NOTIF_KEY) !== 'off',
  );

  constructor() {
    this.applyTheme(this.darkMode());
  }

  private readStoredTheme(): boolean {
    const stored = localStorage.getItem(SettingsService.THEME_KEY);
    if (stored === null) {
      return (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return stored === 'dark';
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.darkMode());
  }

  setDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
    localStorage.setItem(
      SettingsService.THEME_KEY,
      enabled ? 'dark' : 'light',
    );
    this.applyTheme(enabled);
  }

  applyTheme(enabled: boolean): void {
    document.documentElement.classList.toggle('dark', enabled);
    document.documentElement.style.colorScheme = enabled ? 'dark' : 'light';
  }

  setBrowserNotifications(enabled: boolean): void {
    this.browserNotifications.set(enabled);
    localStorage.setItem(
      SettingsService.BROWSER_NOTIF_KEY,
      enabled ? 'on' : 'off',
    );
  }

  setRealtimeNotifications(enabled: boolean): void {
    this.realtimeNotifications.set(enabled);
    localStorage.setItem(
      SettingsService.REALTIME_NOTIF_KEY,
      enabled ? 'on' : 'off',
    );
  }
}