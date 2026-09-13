import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Settings } from './settings';
import { SettingsService } from '../../shared/services/settings.service';
import { WebSocketNotificationService } from '../../shared/services/websocket-notification.service';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { TypeUser, User } from '../../shared/models/User';

describe('Settings', () => {
  let fixture: ComponentFixture<Settings>;
  let component: Settings;

  const currentUser = signal<User | null>(null);
  const darkMode = signal(false);
  const browserNotifications = signal(false);
  const realtimeNotifications = signal(true);
  const connected = signal(true);

  const settingsServiceMock = {
    darkMode,
    browserNotifications,
    realtimeNotifications,
    toggleDarkMode: jasmine.createSpy('toggleDarkMode'),
    setBrowserNotifications: jasmine
      .createSpy('setBrowserNotifications')
      .and.callFake((value: boolean) => browserNotifications.set(value)),
    setRealtimeNotifications: jasmine
      .createSpy('setRealtimeNotifications')
      .and.callFake((value: boolean) => realtimeNotifications.set(value)),
  };
  const websocketServiceMock = {
    connected,
    requestNotificationPermission: jasmine.createSpy(
      'requestNotificationPermission',
    ),
  };
  const userServiceMock = {
    currentUser,
    clearCache: jasmine.createSpy('clearCache'),
  };
  const authServiceMock = {
    logout: jasmine.createSpy('logout'),
  };
  const routerMock = { navigate: jasmine.createSpy('navigate') };

  beforeEach(async () => {
    currentUser.set(null);
    darkMode.set(false);
    browserNotifications.set(false);
    realtimeNotifications.set(true);
    await TestBed.configureTestingModule({
      providers: [
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: WebSocketNotificationService, useValue: websocketServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute the user initials', () => {
    currentUser.set({
      firstName: 'Jane',
      lastName: 'Roe',
      typeUser: TypeUser.PARENT,
    } as User);

    expect(component.userInitials()).toBe('JR');
  });

  it('should return empty initials without a user', () => {
    expect(component.userInitials()).toBe('');
  });

  it('should toggle dark mode through the settings service', () => {
    component.toggleDarkMode();

    expect(settingsServiceMock.toggleDarkMode).toHaveBeenCalled();
  });

  it('should request permission when enabling browser notifications', () => {
    browserNotifications.set(false);

    component.toggleBrowserNotifications();

    expect(websocketServiceMock.requestNotificationPermission).toHaveBeenCalled();
    expect(settingsServiceMock.setBrowserNotifications).toHaveBeenCalledWith(
      true,
    );
  });

  it('should not request permission when disabling browser notifications', () => {
    browserNotifications.set(true);

    component.toggleBrowserNotifications();

    expect(
      websocketServiceMock.requestNotificationPermission,
    ).not.toHaveBeenCalled();
    expect(settingsServiceMock.setBrowserNotifications).toHaveBeenCalledWith(
      false,
    );
  });

  it('should toggle realtime notifications', () => {
    component.toggleRealtimeNotifications();

    expect(settingsServiceMock.setRealtimeNotifications).toHaveBeenCalledWith(
      false,
    );
  });

  it('should navigate to the profile', () => {
    component.goProfile();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should go back to the role dashboard', () => {
    currentUser.set({
      firstName: 'Pro',
      lastName: 'F',
      typeUser: TypeUser.PROFESSEUR,
    } as User);

    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should go back to the home page without a user', () => {
    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should logout', () => {
    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalledWith('/');
  });
});
