import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { ParentDashboard, Tab } from './parent-dashboard';
import { UserService } from '../../../shared/services/user.service';
import { CoursService } from '../../../shared/services/cours.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { BookingService } from '../../../shared/services/booking.service';
import { InvitationService } from '../../../shared/services/invitation.service';
import { NotificationApiService } from '../../../shared/services/notification-api.service';
import { WebSocketNotificationService } from '../../../shared/services/websocket-notification.service';
import { User } from '../../../shared/models/User';
import { resetSpies } from '../../../testing/spies';

describe('ParentDashboard', () => {
  let fixture: ComponentFixture<ParentDashboard>;
  let component: ParentDashboard;

  const currentUser = signal<User | null>(null);
  const latestNotification = signal<unknown>(null);

  const userServiceMock = {
    currentUser,
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(EMPTY),
    clearCache: jasmine.createSpy('clearCache'),
    createChild: jasmine.createSpy('createChild').and.returnValue(EMPTY),
    getUserNamesByIds: jasmine
      .createSpy('getUserNamesByIds')
      .and.returnValue(of(new Map())),
  };
  const coursServiceMock = {
    getAllCours: jasmine.createSpy('getAllCours').and.returnValue(EMPTY),
    getAvailableCours: jasmine
      .createSpy('getAvailableCours')
      .and.returnValue(EMPTY),
  };
  const invoiceServiceMock = {
    getMyInvoices: jasmine.createSpy('getMyInvoices').and.returnValue(EMPTY),
    downloadInvoicePdf: jasmine.createSpy('downloadInvoicePdf'),
    markInvoiceAsPaid: jasmine
      .createSpy('markInvoiceAsPaid')
      .and.returnValue(EMPTY),
    sendInvoiceByEmail: jasmine
      .createSpy('sendInvoiceByEmail')
      .and.returnValue(EMPTY),
  };
  const bookingServiceMock = {
    getBookingsByParent: jasmine
      .createSpy('getBookingsByParent')
      .and.returnValue(EMPTY),
    getBookingById: jasmine.createSpy('getBookingById').and.returnValue(EMPTY),
    createBooking: jasmine.createSpy('createBooking').and.returnValue(EMPTY),
    cancelBooking: jasmine.createSpy('cancelBooking').and.returnValue(EMPTY),
  };
  const authServiceMock = {
    logout: jasmine.createSpy('logout'),
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
  };
  const invitationServiceMock = {};
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
    resetSpies(
      userServiceMock,
      coursServiceMock,
      invoiceServiceMock,
      bookingServiceMock,
      authServiceMock,
      notificationApiMock,
      websocketServiceMock,
      routerMock,
    );
    currentUser.set(null);
    latestNotification.set(null);
    await TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: CoursService, useValue: coursServiceMock },
        { provide: InvoiceService, useValue: invoiceServiceMock },
        { provide: BookingService, useValue: bookingServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: InvitationService, useValue: invitationServiceMock },
        { provide: NotificationApiService, useValue: notificationApiMock },
        { provide: WebSocketNotificationService, useValue: websocketServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParentDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the Overview tab', () => {
    expect(component.activeTab()).toBe(Tab.Overview);
  });

  it('should expose the expected tabs', () => {
    expect(component.tabs.map((t) => t.id)).toEqual([
      'overview',
      'booking',
      'children',
      'invoices',
      'payments',
    ]);
  });

  it('should switch tabs via setActiveTab', () => {
    component.setActiveTab(Tab.Invoices);

    expect(component.activeTab()).toBe(Tab.Invoices);
    expect(component.isActiveTab(Tab.Invoices)).toBe(true);
  });

  it('should switch tabs via onTabChange', () => {
    component.onTabChange('children');

    expect(component.activeTab()).toBe(Tab.Children);
  });

  it('should ignore an unknown tab id', () => {
    component.onTabChange('does-not-exist');

    expect(component.activeTab()).toBe(Tab.Overview);
  });

  it('should set the active tab from the query params', () => {
    TestBed.inject(ActivatedRoute).queryParams = of({ tab: 'invoices' });
    const newFixture = TestBed.createComponent(ParentDashboard);
    newFixture.detectChanges();

    expect(newFixture.componentInstance.activeTab()).toBe(Tab.Invoices);
  });

  it('should logout on navbar logout', () => {
    component.onNavbarLogout();

    expect(authServiceMock.logout).toHaveBeenCalledWith('/');
  });

  it('should navigate to settings from the navbar', () => {
    component.onNavbarSettings();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/settings']);
  });
});
