// student-dashboard.component.ts

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabItem } from '../../../shared/models/TabItem';
import { DashboardTabsComponent } from '../../../shared/components/dashboard-tabs/dashboard-tabs';
import { DashboardNavbarComponent } from '../../../shared/components/dashboard-navbar/dashboard-navbar.component';
import { UserService } from '../../../shared/services/user.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { StudentDashboardService } from './services/student-dashboard.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BookingDetailsModalComponent } from '../../../shared/components/booking-details-modal/booking-details-modal.component';
import { Booking } from '../../../shared/models/Booking';
import { BookingService } from '../../../shared/services/booking.service';

enum Tab {
  Overview = 'overview',
  Courses = 'courses',
  Teachers = 'teachers',
  Progress = 'progress',
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardTabsComponent, DashboardNavbarComponent, BookingDetailsModalComponent],
  templateUrl: './components/student-dashboard.component.html',
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly studentDashboardService = inject(StudentDashboardService);
  private readonly bookingService = inject(BookingService);

  readonly Tab = Tab;
  readonly activeTab = signal<Tab>(Tab.Overview);
  readonly authService = inject(AuthService);

  // Booking details modal
  showBookingDetails = signal(false);
  selectedBookingForDetails = signal<Booking | null>(null);

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

  readonly upcomingCourses = signal<any[]>([]);
  readonly pastCourses = signal<any[]>([]);
  readonly teachers = signal<any[]>([]);
  readonly recentGrades = signal<any[]>([]);
  readonly stats = signal<any>({
    upcomingCourses: 0,
    completedCourses: 0,
    averageGrade: 0,
    pendingHomework: 0,
  });
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      this.loading.set(false);
      return;
    }

    combineLatest({
      bookings: this.studentDashboardService.getStudentBookings(currentUserId),
      bookingStats: this.studentDashboardService.getBookingStats(),
      teachers: this.studentDashboardService.getTeachers(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bookings, bookingStats, teachers }) => {
          // Séparer les cours à venir et passés
          const now = new Date();
          const upcoming = bookings
            .filter((b) => new Date(b.coursDate) > now)
            .map((b) => ({
              id: b.id,
              subject: b.coursMatiere,
              teacher: `Professeur - ${b.coursTitre}`,
              date: b.coursDate,
              status: b.status,
            }));

          const past = bookings
            .filter((b) => new Date(b.coursDate) <= now)
            .map((b) => ({
              id: b.id,
              subject: b.coursMatiere,
              teacher: `Professeur - ${b.coursTitre}`,
              date: b.coursDate,
              duration: b.coursDureeMinutes / 60,
              status: b.status,
            }));

          this.upcomingCourses.set(upcoming);
          this.pastCourses.set(past);
          this.teachers.set(teachers);

          // Mettre à jour les statistiques
          this.stats.set({
            upcomingCourses: upcoming.length,
            completedCourses: bookingStats.completedBookings,
            averageGrade: 0, // À implémenter plus tard
            pendingHomework: 0, // À implémenter plus tard
          });

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données', error);
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'missed':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'CONFIRMED':
        return 'Confirmé';
      case 'PENDING':
        return 'En attente';
      case 'CANCELLED':
        return 'Annulé';
      case 'COMPLETED':
        return 'Terminé';
      case 'MISSED':
        return 'Manqué';
      default:
        return status;
    }
  }

  viewBookingDetails(bookingId: number): void {
    this.bookingService.getBookingById(bookingId).subscribe({
      next: (booking: Booking) => {
        this.selectedBookingForDetails.set(booking);
        this.showBookingDetails.set(true);
      },
      error: (error: Error) => {
        console.error('Failed to load booking details:', error);
      }
    });
  }

  closeBookingDetails(): void {
    this.showBookingDetails.set(false);
    this.selectedBookingForDetails.set(null);
  }

  onNavbarSettings(): void {
    alert('Redirection vers les paramètres...');
  }

  onNavbarLogout(): void {
    this.userService.clearCache();
    this.authService.logout('/');
  }

  onTabChange(tabId: string): void {
    const tab = Object.values(Tab).find((t) => t === tabId);
    if (tab) {
      this.activeTab.set(tab);
    }
  }
}
