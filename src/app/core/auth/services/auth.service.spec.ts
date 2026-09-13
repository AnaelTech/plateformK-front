import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from './auth.service';
import { UserService } from '../../../shared/services/user.service';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { User, TypeUser } from '../../../shared/models/User';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    typeUser: TypeUser.PROFESSEUR,
    emailValid: true,
    registrationDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    birthDate: '1990-01-15',
    phoneNumber: '0612345678',
    city: 'Paris',
    address: '123 Rue de la Paix',
    postalCode: 75001
  };

  const mockAuthResponse: AuthResponse = {
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxOTk5OTk5OTk5fQ.signature',
    refreshToken: 'refresh-token-123',
    tokenType: 'Bearer',
    user: mockUser
  };

  const mockExpiredToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxMDAwMDAwMDAwfQ.signature';

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    userServiceSpy = jasmine.createSpyObj('UserService', [
      'getCurrentUser',
      'clearCache'
    ]);
    userServiceSpy.getCurrentUser.and.returnValue(of(mockUser));

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('register', () => {
    it('should send registration request', () => {
      const registerData: RegisterRequest = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '0612345678',
        city: 'Paris'
      };

      service.register(registerData).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/auth/register'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush({ message: 'User registered successfully' });
    });
  });

  describe('login', () => {
    it('should login successfully and save tokens', fakeAsync(() => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(localStorage.getItem('auth_token')).toBe(
          mockAuthResponse.accessToken
        );
        expect(localStorage.getItem('refresh_token')).toBe(
          mockAuthResponse.refreshToken
        );
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockAuthResponse);

      tick();
    }));

    it('should call userService.getCurrentUser after successful login', fakeAsync(() => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
      req.flush(mockAuthResponse);

      tick();
      expect(userServiceSpy.getCurrentUser).toHaveBeenCalled();
    }));
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      localStorage.setItem('refresh_token', 'old-refresh-token');

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(localStorage.getItem('auth_token')).toBe(
          mockAuthResponse.accessToken
        );
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/auth/refresh'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.refreshToken).toBe('old-refresh-token');
      req.flush(mockAuthResponse);
    });

    it('should throw error when no refresh token available', () => {
      localStorage.removeItem('refresh_token');

      let error: Error | undefined;
      service.refreshToken().subscribe({ error: (e) => (error = e) });

      expect(error?.message).toBe('No refresh token available');
    });
  });

  describe('logout', () => {
    it('should clear tokens and navigate on logout', fakeAsync(() => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem('token_expires_at', '9999999999999');

      service.logout('/login');

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/auth/logout'
      );
      expect(req.request.method).toBe('POST');
      req.flush({});

      tick();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('token_expires_at')).toBeNull();
      expect(userServiceSpy.clearCache).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should clear tokens even if logout request fails', fakeAsync(() => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');

      service.logout('/');

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/auth/logout'
      );
      req.error(new ErrorEvent('Network error'));

      tick();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should navigate without request if no refresh token', () => {
      localStorage.removeItem('refresh_token');

      service.logout('/home');

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('auth_token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });

    it('should return null if no token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from localStorage', () => {
      localStorage.setItem('refresh_token', 'my-refresh-token');
      expect(service.getRefreshToken()).toBe('my-refresh-token');
    });

    it('should return null if no refresh token', () => {
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true for valid non-expired token', () => {
      localStorage.setItem('auth_token', mockAuthResponse.accessToken);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false for expired token', () => {
      localStorage.setItem('auth_token', mockExpiredToken);
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return false for no token', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      expect(service.isTokenExpired(mockAuthResponse.accessToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      expect(service.isTokenExpired(mockExpiredToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(service.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('refreshing state', () => {
    it('should track refreshing state', () => {
      expect(service.getIsRefreshing()).toBe(false);
      service.setIsRefreshing(true);
      expect(service.getIsRefreshing()).toBe(true);
      service.setIsRefreshing(false);
      expect(service.getIsRefreshing()).toBe(false);
    });

    it('should provide refresh token subject', () => {
      const subject = service.getRefreshTokenSubject();
      expect(subject).toBeTruthy();
      expect(subject.getValue()).toBeNull();
    });
  });
});
