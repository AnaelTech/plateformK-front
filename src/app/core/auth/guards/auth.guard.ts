import { inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserService } from '../../../shared/services/user.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { getDashboardRoute } from '../../routing/dashboard-routes';

/**
 * Authentication Guard
 *
 * Protects routes that require authentication.
 * Redirects to login if user is not authenticated.
 */
export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    notifications.warning('Please log in to access this page');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  return true;
};

/**
 * Role Guard Factory
 *
 * Creates a guard that checks if user has required role.
 * Usage: canActivate: [roleGuard(['TEACHER', 'ADMIN'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const userService = inject(UserService);
    const router = inject(Router);
    const notifications = inject(NotificationService);

    // First check authentication
    if (!authService.isLoggedIn()) {
      notifications.warning('Please log in to access this page');
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Get current user from cache
    const currentUser = userService.currentUser();

    // If user is authenticated but currentUser signal is empty (e.g., after page refresh or back navigation),
    // fetch the user data from the server
    if (!currentUser) {
      return userService.getCurrentUser().pipe(
        map((user) => {
          // Check if user has required role
          const userRole = user.typeUser;
          if (!allowedRoles.includes(userRole)) {
            notifications.error(
              'You do not have permission to access this page',
            );
            navigateToRoleDashboard(router, userRole);
            return false;
          }
          return true;
        }),
        catchError(() => {
          notifications.error('Failed to load user information');
          router.navigate(['/login']);
          return of(false);
        }),
      );
    }

    // Check if user has required role
    const userRole = currentUser.typeUser;
    if (!allowedRoles.includes(userRole)) {
      notifications.error('You do not have permission to access this page');
      navigateToRoleDashboard(router, userRole);
      return false;
    }

    return true;
  };
}

/**
 * Helper function to navigate to the appropriate dashboard based on user role
 */
function navigateToRoleDashboard(router: Router, userRole: string): void {
  router.navigate([getDashboardRoute(userRole)]);
}

/**
 * Login Guard
 *
 * Prevents authenticated users from accessing login page.
 * Redirects to appropriate dashboard if already logged in.
 */
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  // If user is not logged in, allow access to login page
  if (!authService.isLoggedIn()) {
    return true;
  }

  // User is logged in, check if we have user data
  const currentUser = userService.currentUser();

  if (currentUser) {
    // Redirect to role-specific dashboard
    navigateToRoleDashboard(router, currentUser.typeUser);
    return false;
  }

  // User is logged in but currentUser signal is empty, fetch user data
  return userService.getCurrentUser().pipe(
    map((user) => {
      navigateToRoleDashboard(router, user.typeUser);
      return false;
    }),
    catchError(() => {
      // If we can't load user data, allow access to login page
      return of(true);
    }),
  );
};
