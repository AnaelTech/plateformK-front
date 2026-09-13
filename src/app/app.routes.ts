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
      import('./features/login/login').then((m) => m.LoginComponent),
    canActivate: [loginGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.LoginComponent),
    canActivate: [loginGuard],
  },
  {
    path: 'register/invitation/:token',
    loadComponent: () =>
      import('./features/register-invitation/register-invitation.component').then(
        (m) => m.RegisterInvitationComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/teacher/teacher-dashboard').then(
        (m) => m.TeacherDashboardComponent,
      ),
    canActivate: [roleGuard(['PROFESSEUR'])],
  },
  {
    path: 'parent-dashboard',
    loadComponent: () =>
      import('./features/dashboard/parent/parent-dashboard').then(
        (m) => m.ParentDashboardComponent,
      ),
    canActivate: [roleGuard(['PARENT'])],
  },
  {
    path: 'student-dashboard',
    loadComponent: () =>
      import('./features/dashboard/student/student-dashboard').then(
        (m) => m.StudentDashboardComponent,
      ),
    canActivate: [roleGuard(['ELEVE'])],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/reset-password/reset-password').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/page-not-found/page-not-found').then(
        (m) => m.PageNotFoundComponent,
      ),
  },
];
