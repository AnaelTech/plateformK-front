import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { AuthResponse } from '../../auth/models/auth.model';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const authResponse: AuthResponse = {
    accessToken: 'new-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    user: {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      typeUser: 'PROFESSEUR',
      emailValid: true,
    } as unknown as AuthResponse['user'],
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getToken',
      'isTokenExpired',
      'getIsRefreshing',
      'getRefreshTokenSubject',
      'refreshToken',
      'logout',
      'setIsRefreshing',
      'resetRefreshTokenSubject',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("ajoute le header Authorization quand un token valide existe", () => {
    authServiceSpy.getToken.and.returnValue('token-123');
    authServiceSpy.isTokenExpired.and.returnValue(false);

    http.get('/api/v1/users').subscribe();

    const req = httpMock.expectOne('/api/v1/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it("n'ajoute pas de header pour les endpoints d'authentification", () => {
    http.post('/api/v1/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('sur 401, rafraîchit le token puis rejoue la requête', () => {
    authServiceSpy.getToken.and.returnValue('old-token');
    authServiceSpy.isTokenExpired.and.returnValue(false);
    authServiceSpy.getIsRefreshing.and.returnValue(false);
    authServiceSpy.getRefreshTokenSubject.and.returnValue(
      new BehaviorSubject<string | null>(null),
    );
    authServiceSpy.refreshToken.and.returnValue(of(authResponse));

    http.get('/api/v1/users').subscribe();

    const first = httpMock.expectOne('/api/v1/users');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });

    const retry = httpMock.expectOne('/api/v1/users');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({});

    expect(authServiceSpy.setIsRefreshing).toHaveBeenCalledWith(true);
    expect(authServiceSpy.setIsRefreshing).toHaveBeenCalledWith(false);
  });

  it('si le refresh échoue, termine les requêtes (pas de blocage) et déconnecte', () => {
    authServiceSpy.getToken.and.returnValue('old-token');
    authServiceSpy.isTokenExpired.and.returnValue(false);
    authServiceSpy.getIsRefreshing.and.returnValue(false);
    authServiceSpy.getRefreshTokenSubject.and.returnValue(
      new BehaviorSubject<string | null>(null),
    );
    authServiceSpy.refreshToken.and.returnValue(
      throwError(() => new Error('refresh failed')),
    );

    let errored = false;
    http.get('/api/v1/users').subscribe({ error: () => (errored = true) });

    const req = httpMock.expectOne('/api/v1/users');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(errored).toBeTrue();
    expect(authServiceSpy.resetRefreshTokenSubject).toHaveBeenCalled();
    expect(authServiceSpy.logout).toHaveBeenCalledWith('/login');
  });
});
