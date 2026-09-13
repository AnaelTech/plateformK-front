import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { TeacherDashboard, Tab } from './teacher-dashboard';
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

describe('TeacherDashboard', () => {
  let fixture: ComponentFixture<TeacherDashboard>;
  let component: TeacherDashboard;

  const currentUser = signal<User | null>(null);
  const latestNotification = signal<unknown>(null);

  const userServiceMock = {
    currentUser,
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(EMPTY),
    clearCache: jasmine.createSpy('clearCache'),
    getAllUsers: jasmine.createSpy('getAllUsers').and.returnValue(EMPTY),
    getParentsByStudentId: jasmine
      .createSpy('getParentsByStudentId')
      .and.returnValue(EMPTY),
  };
  const coursServiceMock = {
    getAllCours: jasmine.createSpy('getAllCours').and.returnValue(EMPTY),
    createCours: jasmine.createSpy('createCours').and.returnValue(EMPTY),
    deleteCours: jasmine.createSpy('deleteCours').and.returnValue(EMPTY),
    getCompletedUnbilledCours: jasmine
      .createSpy('getCompletedUnbilledCours')
      .and.returnValue(EMPTY),
  };
  const invoiceServiceMock = {
    getMyInvoices: jasmine.createSpy('getMyInvoices').and.returnValue(EMPTY),
    createInvoice: jasmine.createSpy('createInvoice').and.returnValue(EMPTY),
    downloadInvoicePdf: jasmine.createSpy('downloadInvoicePdf'),
    markInvoiceAsPaid: jasmine
      .createSpy('markInvoiceAsPaid')
      .and.returnValue(EMPTY),
    markInvoiceAsUnpaid: jasmine
      .createSpy('markInvoiceAsUnpaid')
      .and.returnValue(EMPTY),
    sendInvoiceByEmail: jasmine
      .createSpy('sendInvoiceByEmail')
      .and.returnValue(EMPTY),
  };
  const bookingServiceMock = {
    getBookings: jasmine.createSpy('getBookings').and.returnValue(EMPTY),
    getBookingStats: jasmine
      .createSpy('getBookingStats')
      .and.returnValue(EMPTY),
    cancelBooking: jasmine.createSpy('cancelBooking').and.returnValue(EMPTY),
    completeBooking: jasmine
      .createSpy('completeBooking')
      .and.returnValue(EMPTY),
    confirmBooking: jasmine
      .createSpy('confirmBooking')
      .and.returnValue(EMPTY),
  };
  const authServiceMock = {
    logout: jasmine.createSpy('logout'),
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
  };
  const invitationServiceMock = {
    sendInvitation: jasmine.createSpy('sendInvitation').and.returnValue(EMPTY),
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
    resetSpies(
      userServiceMock,
      coursServiceMock,
      invoiceServiceMock,
      bookingServiceMock,
      authServiceMock,
      invitationServiceMock,
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

    fixture = TestBed.createComponent(TeacherDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the overview tab', () => {
    expect(component.activeTab()).toBe('overview');
  });

  it('should expose the expected tabs', () => {
    expect(component.tabs.map((t) => t.id)).toEqual([
      'overview',
      'courses',
      'students',
      'invoices',
      'calendar',
    ]);
  });

  it('should switch tabs via setActiveTab', () => {
    component.setActiveTab(Tab.Invoices);

    expect(component.activeTab()).toBe('invoices');
  });

  it('should switch tabs via onTabChange', () => {
    component.onTabChange('students');

    expect(component.activeTab()).toBe('students');
  });

  it('should set the active tab from the query params', () => {
    TestBed.inject(ActivatedRoute).queryParams = of({ tab: 'courses' });
    const newFixture = TestBed.createComponent(TeacherDashboard);
    newFixture.detectChanges();

    expect(newFixture.componentInstance.activeTab()).toBe('courses');
    newFixture.destroy();
  });

  it('should logout', () => {
    component.onLogout();

    expect(authServiceMock.logout).toHaveBeenCalledWith('/');
  });

  it('should navigate to settings', () => {
    component.onSettings();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/settings']);
  });
});
