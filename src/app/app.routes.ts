import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { TeacherDashboardComponent } from './features/dashboard/teacher/teacher-dasboard';
import { ParentDashboardComponent } from './features/dashboard/parent/parent-dashboard';
import { StudentDashboardComponent } from './features/dashboard/student/student-dashboard';
import { PageNotFoundComponent } from './features/page-not-found/page-not-found';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: TeacherDashboardComponent,
  },
  {
    path: 'dashboard/parent',
    component: ParentDashboardComponent,
  },
  {
    path: 'dashboard/eleve',
    component: StudentDashboardComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];
