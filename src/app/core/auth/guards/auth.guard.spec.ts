import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { authGuard, loginGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { UserService } from '../../../shared/services/user.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { TypeUser, User } from '../../../shared/models/User';

describe('auth guards', () => {
  let authServiceMock: { isLoggedIn: jasmine.Spy };
  let userServiceMock: {
    currentUser: jasmine.Spy;
    getCurrentUser: jasmine.Spy;
  };
  let routerMock: { navigate: jasmine.Spy };
  let notificationMock: { warning: jasmine.Spy; error: jasmine.Spy };

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/dashboard' } as RouterStateSnapshot;

  const professor: User = {
    id: 1,
    email: 'prof@example.com',
    firstName: 'Pro',
    lastName: 'Fesseur',
    typeUser: TypeUser.PROFESSEUR,
  } as User;

  beforeEach(() => {
    authServiceMock = { isLoggedIn: jasmine.createSpy('isLoggedIn') };
    userServiceMock = {
      currentUser: jasmine.createSpy('currentUser'),
      getCurrentUser: jasmine.createSpy('getCurrentUser'),
    };
    routerMock = { navigate: jasmine.createSpy('navigate') };
    notificationMock = {
      warning: jasmine.createSpy('warning'),
      error: jasmine.createSpy('error'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    });
  });

  describe('authGuard', () => {
    it('allows access when authenticated', () => {
      authServiceMock.isLoggedIn.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(true);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('redirects to login when not authenticated', () => {
      authServiceMock.isLoggedIn.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard' },
      });
      expect(notificationMock.warning).toHaveBeenCalled();
    });
  });

  describe('roleGuard', () => {
    it('allows access when the cached user has the required role', () => {
      authServiceMock.isLoggedIn.and.returnValue(true);
      userServiceMock.currentUser.and.returnValue(professor);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard([TypeUser.PROFESSEUR])(route, state),
      );

      expect(result).toBe(true);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('redirects to the role dashboard when the role is not allowed', () => {
      authServiceMock.isLoggedIn.and.returnValue(true);
      userServiceMock.currentUser.and.returnValue(professor);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard([TypeUser.PARENT])(route, state),
      );

      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('loads the user then allows access when the cache is empty', (done) => {
      authServiceMock.isLoggedIn.and.returnValue(true);
      userServiceMock.currentUser.and.returnValue(null);
      userServiceMock.getCurrentUser.and.returnValue(of(professor));

      const result$ = TestBed.runInInjectionContext(() =>
        roleGuard([TypeUser.PROFESSEUR])(route, state),
      ) as Observable<boolean>;

      result$.subscribe((allowed) => {
        expect(allowed).toBe(true);
        done();
      });
    });

    it('redirects to login when loading the user fails', (done) => {
      authServiceMock.isLoggedIn.and.returnValue(true);
      userServiceMock.currentUser.and.returnValue(null);
      userServiceMock.getCurrentUser.and.returnValue(
        throwError(() => new Error('network')),
      );

      const result$ = TestBed.runInInjectionContext(() =>
        roleGuard([TypeUser.PROFESSEUR])(route, state),
      ) as Observable<boolean>;

      result$.subscribe((allowed) => {
        expect(allowed).toBe(false);
        expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
    });
  });

  describe('loginGuard', () => {
    it('allows access to login when not authenticated', () => {
      authServiceMock.isLoggedIn.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => loginGuard(route, state));

      expect(result).toBe(true);
    });

    it('redirects an authenticated user to their dashboard', () => {
      authServiceMock.isLoggedIn.and.returnValue(true);
      userServiceMock.currentUser.and.returnValue(professor);

      const result = TestBed.runInInjectionContext(() => loginGuard(route, state));

      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
