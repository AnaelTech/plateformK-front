import { Routes } from '@angular/router';
import {
  authGuard,
  roleGuard,
  loginGuard,
} from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.Login),
    canActivate: [loginGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.Login),
    canActivate: [loginGuard],
  },
  {
    path: 'register/invitation/:token',
    loadComponent: () =>
      import('./features/register-invitation/register-invitation').then(
        (m) => m.RegisterInvitation,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/teacher/teacher-dashboard').then(
        (m) => m.TeacherDashboard,
      ),
    canActivate: [roleGuard(['PROFESSEUR'])],
  },
  {
    path: 'parent-dashboard',
    loadComponent: () =>
      import('./features/dashboard/parent/parent-dashboard').then(
        (m) => m.ParentDashboard,
      ),
    canActivate: [roleGuard(['PARENT'])],
  },
  {
    path: 'student-dashboard',
    loadComponent: () =>
      import('./features/dashboard/student/student-dashboard').then(
        (m) => m.StudentDashboard,
      ),
    canActivate: [roleGuard(['ELEVE'])],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/reset-password/reset-password').then(
        (m) => m.ResetPassword,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile').then((m) => m.Profile),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings').then((m) => m.Settings),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/page-not-found/page-not-found').then(
        (m) => m.PageNotFound,
      ),
  },
];
