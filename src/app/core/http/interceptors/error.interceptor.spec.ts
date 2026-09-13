import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from '../../../shared/services/notification.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    notificationSpy = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'error',
      'warning',
      'success',
      'info',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('rejette le HttpErrorResponse d’origine et notifie sur 500', () => {
    let captured: unknown;
    http.get('/api/v1/users').subscribe({ error: (e) => (captured = e) });

    const req = httpMock.expectOne('/api/v1/users');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(notificationSpy.error).toHaveBeenCalled();
    expect(captured instanceof HttpErrorResponse).toBeTrue();
    expect((captured as HttpErrorResponse).status).toBe(500);
  });

  it('notifie sur 403', () => {
    http.get('/api/v1/users').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/v1/users');
    req.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(notificationSpy.error).toHaveBeenCalled();
  });

  it('notifie la session expirée uniquement pour /auth/refresh en 401', () => {
    http.post('/api/v1/auth/refresh', {}).subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/v1/auth/refresh');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(notificationSpy.error).toHaveBeenCalled();
  });

  it('ne notifie pas pour un 401 hors refresh', () => {
    http.get('/api/v1/users').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/v1/users');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(notificationSpy.error).not.toHaveBeenCalled();
  });
});
