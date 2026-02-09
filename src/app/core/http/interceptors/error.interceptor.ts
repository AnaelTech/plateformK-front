import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification.service';

/**
 * HTTP Error Interceptor
 *
 * Handles all HTTP errors globally and provides consistent error handling.
 * Displays user-friendly messages via notification service.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificationService: NotificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network Error: ${error.error.message}`;
        console.error('Client-side error:', error.error.message);
      } else {
        // Backend error
        switch (error.status) {
          case 400:
            errorMessage =
              error.error?.message || 'Bad Request: Invalid data submitted';
            console.error('Bad Request (400):', error.error);
            break;

          case 401:
            // Handled by authInterceptor (token refresh)
            // Only show notification if refresh fails
            if (req.url.includes('/auth/refresh-token')) {
              errorMessage = 'Session expired. Please log in again.';
              console.error('Authentication failed (401)');
              notificationService.error(errorMessage, 5000);
            }
            break;

          case 403:
            errorMessage =
              'Access Denied: You do not have permission to perform this action';
            console.error('Forbidden (403):', error.url);
            notificationService.error(errorMessage, 5000);
            break;

          case 404:
            errorMessage = error.error?.message || 'Resource not found';
            console.error('Not Found (404):', error.url);
            notificationService.error(errorMessage);
            break;

          case 409:
            errorMessage =
              error.error?.message || 'Conflict: Resource already exists';
            console.error('Conflict (409):', error.error);
            notificationService.warning(errorMessage);
            break;

          case 422:
            errorMessage =
              error.error?.message ||
              'Validation Error: Please check your input';
            console.error('Unprocessable Entity (422):', error.error);
            notificationService.warning(errorMessage);
            break;

          case 429:
            errorMessage =
              error.error?.message ||
              'Too many requests. Please try again later.';
            const retryAfter = error.headers.get('Retry-After');
            if (retryAfter) {
              errorMessage += ` Retry after ${retryAfter} seconds.`;
            }
            console.warn('Rate Limit (429):', errorMessage);
            notificationService.warning(errorMessage, 5000);
            break;

          case 500:
            errorMessage = 'Server Error: Something went wrong on our end';
            console.error('Internal Server Error (500):', error.error);
            notificationService.error(errorMessage, 5000);
            break;

          case 502:
            errorMessage = 'Bad Gateway: The server is temporarily unavailable';
            console.error('Bad Gateway (502)');
            notificationService.error(errorMessage, 5000);
            break;

          case 503:
            errorMessage =
              'Service Unavailable: The server is under maintenance';
            console.error('Service Unavailable (503)');
            notificationService.error(errorMessage, 5000);
            break;

          case 504:
            errorMessage =
              'Gateway Timeout: The request took too long to process';
            console.error('Gateway Timeout (504)');
            notificationService.error(errorMessage, 5000);
            break;

          case 0:
            errorMessage =
              'Network Error: Cannot connect to server. Please check your internet connection.';
            console.error('Network Error (0): Server unreachable');
            notificationService.error(errorMessage, 5000);
            break;

          default:
            errorMessage =
              error.error?.message ||
              `Unexpected error occurred (${error.status})`;
            console.error(`HTTP Error (${error.status}):`, error.error);
            notificationService.error(errorMessage);
        }
      }

      // Return error observable for component-level handling
      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        originalError: error,
      }));
    }),
  );
};
