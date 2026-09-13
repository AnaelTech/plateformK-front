import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';

import { StudentDashboard } from './student-dashboard';
import { UserService } from '../../../shared/services/user.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { BookingService } from '../../../shared/services/booking.service';
import { NotificationApiService } from '../../../shared/services/notification-api.service';
import { WebSocketNotificationService } from '../../../shared/services/websocket-notification.service';
import { User } from '../../../shared/models/User';

describe('StudentDashboard', () => {
  let fixture: ComponentFixture<StudentDashboard>;
  let component: StudentDashboard;

  const currentUser = signal<User | null>(null);
  const latestNotification = signal<unknown>(null);

  const userServiceMock = {
    currentUser,
    clearCache: jasmine.createSpy('clearCache'),
  };
  const bookingServiceMock = {
    getBookingsByEleve: jasmine
      .createSpy('getBookingsByEleve')
      .and.returnValue(EMPTY),
    getBookingStats: jasmine
      .createSpy('getBookingStats')
      .and.returnValue(EMPTY),
    getBookingById: jasmine.createSpy('getBookingById').and.returnValue(EMPTY),
  };
  const authServiceMock = {
    logout: jasmine.createSpy('logout'),
  };
  const notificationApiMock = {
    unreadCount: signal(0),
    refreshUnreadCount: jasmine.createSpy('refreshUnreadCount'),
    refreshNotifications: jasmine.createSpy('refreshNotifications'),
    addNotificationToCache: jasmine.createSpy('addNotificationToCache'),
  };
  const websocketServiceMock = {
    latestNotification,
    clearLatestNotification: jasmine.createSpy('clearLatestNotification'),
  };
  const routerMock = { navigate: jasmine.createSpy('navigate') };

  beforeEach(async () => {
    currentUser.set(null);
    latestNotification.set(null);
    await TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: BookingService, useValue: bookingServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationApiService, useValue: notificationApiMock },
        { provide: WebSocketNotificationService, useValue: websocketServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the Overview tab', () => {
    expect(component.activeTab()).toBe(component.Tab.Overview);
  });

  it('should expose the expected tabs', () => {
    expect(component.tabs.map((t) => t.id)).toEqual([
      'overview',
      'courses',
      'teachers',
      'progress',
    ]);
  });

  it('should switch tabs via setActiveTab', () => {
    component.setActiveTab(component.Tab.Courses);

    expect(component.activeTab()).toBe(component.Tab.Courses);
  });

  it('should switch tabs via onTabChange', () => {
    component.onTabChange('teachers');

    expect(component.activeTab()).toBe(component.Tab.Teachers);
  });

  it('should ignore an unknown tab id', () => {
    component.onTabChange('nope');

    expect(component.activeTab()).toBe(component.Tab.Overview);
  });

  it('should clear the cache and logout from the navbar', () => {
    component.onNavbarLogout();

    expect(userServiceMock.clearCache).toHaveBeenCalled();
    expect(authServiceMock.logout).toHaveBeenCalledWith('/');
  });

  it('should navigate to settings from the navbar', () => {
    component.onNavbarSettings();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('should format a user name into initials', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
  });
});
