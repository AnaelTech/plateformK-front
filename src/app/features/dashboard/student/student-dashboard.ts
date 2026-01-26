// student-dashboard.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UpcomingCourse,
  PastCourse,
  Teacher,
  Grade,
} from '../../../shared/models/Student';
import { TabItem } from '../../../shared/models/TabItem';
import { DashboardTabsComponent } from '../../../shared/components/dashboard-tabs/dashboard-tabs';
import { DashboardNavbarComponent } from '../../../shared/components/dashboard-navbar/dashboard-navbar.component';
import { UserService } from '../../../shared/services/user.service';
import { AuthService } from '../../../core/auth/services/auth.service';

enum Tab {
  Overview = 'overview',
  Courses = 'courses',
  Teachers = 'teachers',
  Progress = 'progress',
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardTabsComponent, DashboardNavbarComponent],
  templateUrl: './components/student-dashboard.component.html',
})
export class StudentDashboardComponent {

  // Onglet actif

  readonly Tab = Tab;

  readonly activeTab = signal<Tab>(Tab.Overview);

  readonly authService = inject(AuthService);

  readonly tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Tableau de bord',
      mobileLabel: 'Accueil',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      id: 'courses',
      label: 'Mes cours',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      id: 'teachers',
      label: 'Mes professeurs',
      mobileLabel: 'Professeurs',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
      id: 'progress',
      label: 'Mes progrès',
      mobileLabel: 'Progrès',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
  ];

  readonly userService = inject(UserService);

  readonly currentUser = this.userService.currentUser;

  // Données statistiques du tableau de bord
  stats = {
    upcomingCourses: 5,
    averageGrade: 15.8,
    pendingHomework: 2,
    completedCourses: 42,
  };

  // Prochains cours
  upcomingCourses: UpcomingCourse[] = [
    {
      id: 1,
      subject: 'Mathématiques',
      teacher: 'Mme. Leclerc',
      date: new Date('2025-12-30T14:00:00'),
      status: 'confirmed',
    },
    {
      id: 2,
      subject: 'Physique-Chimie',
      teacher: 'M. Bertrand',
      date: new Date('2025-12-31T10:00:00'),
      status: 'confirmed',
    },
    {
      id: 3,
      subject: 'Anglais',
      teacher: 'Ms. Johnson',
      date: new Date('2026-01-02T16:00:00'),
      status: 'pending',
    },
  ];

  // Historique des cours
  pastCourses: PastCourse[] = [
    {
      id: 101,
      subject: 'Français',
      teacher: 'Mme. Dubois',
      date: new Date('2025-12-20'),
      duration: 1,
      status: 'completed',
    },
    {
      id: 102,
      subject: 'Histoire-Géo',
      teacher: 'M. Martin',
      date: new Date('2025-12-18'),
      duration: 1.5,
      status: 'completed',
    },
    {
      id: 103,
      subject: 'Mathématiques',
      teacher: 'Mme. Leclerc',
      date: new Date('2025-12-15'),
      duration: 1,
      status: 'missed',
    },
  ];

  // Liste des professeurs
  teachers: Teacher[] = [
    {
      id: 1,
      name: 'Mme. Leclerc',
      subject: 'Mathématiques',
      email: 'leclerc@klassio.fr',
    },
    {
      id: 2,
      name: 'M. Bertrand',
      subject: 'Physique-Chimie',
      email: 'bertrand@klassio.fr',
    },
    {
      id: 3,
      name: 'Ms. Johnson',
      subject: 'Anglais',
      email: 'johnson@klassio.fr',
    },
    {
      id: 4,
      name: 'Mme. Dubois',
      subject: 'Français',
      email: 'dubois@klassio.fr',
    },
  ];

  // Dernières notes
  recentGrades: Grade[] = [
    {
      id: 1,
      subject: 'Mathématiques',
      value: 17,
      date: new Date('2025-12-20'),
    },
    { id: 2, subject: 'Physique', value: 14.5, date: new Date('2025-12-15') },
    { id: 3, subject: 'Anglais', value: 18, date: new Date('2025-12-10') },
    { id: 4, subject: 'Français', value: 15, date: new Date('2025-12-05') },
  ];

  // Changer d'onglet
  setActiveTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  // Récupérer les initiales du nom
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Formater une date (utilisé avec DatePipe dans le template)
  // Mais on garde une méthode pour les cas spécifiques si besoin
  formatDateTime(date: Date): string {
    return date.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Couleur du badge selon le statut
  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'missed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Libellé du statut
  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      case 'missed':
        return 'Manqué';
      default:
        return status;
    }
  }

  onNavbarSettings(): void {
    alert('Redirection vers les paramètres...');
  }

  onNavbarLogout(): void {
    this.userService.clearCache();
    this.authService.logout('/');
  }

  onTabChange(tabId: string) {
    const tab = Object.values(Tab).find((t) => t === tabId);
    if (tab) {
      this.activeTab.set(tab);
    }
  }
}
