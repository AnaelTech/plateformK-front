// student-dashboard.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

enum Tab {
  Overview = 'overview',
  Courses = 'courses',
  Teachers = 'teachers',
  Progress = 'progress',
}

interface UpcomingCourse {
  id: number;
  subject: string;
  teacher: string;
  date: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface PastCourse {
  id: number;
  subject: string;
  teacher: string;
  date: Date;
  duration: number;
  status: 'completed' | 'missed';
}

interface Teacher {
  id: number;
  name: string;
  subject: string;
  email: string;
}

interface Grade {
  id: number;
  subject: string;
  value: number;
  date: Date;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './components/student-dashboard.component.html',
})
export class StudentDashboardComponent {
  // Onglet actif
  activeTab: Tab = Tab.Overview;
  Tab = Tab; // Pour l'utiliser dans le template avec Tab.Overview etc.

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
    this.activeTab = tab;
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
}
