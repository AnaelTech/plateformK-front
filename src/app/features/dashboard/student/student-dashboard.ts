import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TabItem } from '../../../shared/models/TabItem';
import { DashboardTabsComponent } from '../../../shared/components/dashboard-tabs/dashboard-tabs';
import { DashboardNavbarComponent } from '../../../shared/components/dashboard-navbar/dashboard-navbar.component';
import { UserService } from '../../../shared/services/user.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { forkJoin } from 'rxjs';
import { BookingDetailsModalComponent } from '../../../shared/components/booking-details-modal/booking-details-modal.component';
import { Booking, BookingStatus } from '../../../shared/models/Booking';
import { BookingService } from '../../../shared/services/booking.service';
import { Teacher } from '../../../shared/models/Student';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { getStatusColor, getStatusLabel } from '../../../shared/utils/status.utils';
import { getInitials } from '../../../shared/utils/string.utils';

interface CourseDisplay {
  id: number;
  subject: string;
  teacher: string;
  date: string;
  status: BookingStatus;
  duration?: number;
  description?: string;
  value?: number;
}

interface StudentStats {
  upcomingCourses: number;
  completedCourses: number;
}

enum Tab {
  Overview = 'overview',
  Courses = 'courses',
  Teachers = 'teachers',
  Progress = 'progress',
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [DashboardTabsComponent, DashboardNavbarComponent, BookingDetailsModalComponent],
  providers: [DateFormatPipe],
  templateUrl: './components/student-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardComponent implements OnInit {
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

  readonly upcomingCourses = signal<CourseDisplay[]>([]);
  readonly pastCourses = signal<CourseDisplay[]>([]);
  readonly teachers = signal<Teacher[]>([]);
  readonly recentGrades = signal<CourseDisplay[]>([]);
  readonly stats = signal<StudentStats>({
    upcomingCourses: 0,
    completedCourses: 0,
  });
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private readonly datePipe = inject(DateFormatPipe);
  private readonly router = inject(Router);

  private loadDashboardData(): void {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      this.loading.set(false);
      return;
    }

    forkJoin({
      bookings: this.bookingService.getBookingsByEleve(currentUserId),
      bookingStats: this.bookingService.getBookingStats(),
    }).subscribe({
        next: ({ bookings, bookingStats }) => {
          // Séparer les cours à venir et passés
          const now = new Date();
          const upcoming = bookings
            .filter((b) => new Date(b.coursDate) > now)
            .map((b) => ({
              id: b.id,
              subject: b.coursMatiere,
              teacher: b.teacherName || '',
              date: b.coursDate,
              status: b.status,
            }));

          const past = bookings
            .filter((b) => new Date(b.coursDate) <= now)
            .map((b) => ({
              id: b.id,
              subject: b.coursMatiere,
              teacher: b.teacherName || '',
              date: b.coursDate,
              duration: b.coursDureeMinutes / 60,
              status: b.status,
            }));

          this.upcomingCourses.set(upcoming);
          this.pastCourses.set(past);

          // Dériver les professeurs depuis les bookings (sans appel API séparé)
          const teacherMap = new Map<string, Teacher>();
          bookings.forEach((b) => {
            const key =
              b.teacherName || `${b.coursMatiere}-${b.coursTitre}`;
            if (!teacherMap.has(key)) {
              teacherMap.set(key, {
                id: key.length + b.id,
                name: b.teacherName || '',
                subject: b.coursMatiere,
                email: '',
              });
            }
          });
          this.teachers.set(Array.from(teacherMap.values()));

          // Mettre à jour les statistiques
          this.stats.set({
            upcomingCourses: upcoming.length,
            completedCourses: bookingStats.completedBookings,
          });

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données', error);
          this.loading.set(false);
        },
      });
  }

  setActiveTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  getInitials(name: string): string {
    return getInitials(name);
  }

  formatDateTime(date: Date | string): string {
    return this.datePipe.transform(date, 'datetime');
  }

  formatDate(date: Date | string): string {
    return this.datePipe.transform(date, 'date');
  }

  getStatusColor(status: string): string {
    return getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return getStatusLabel(status);
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
    this.router.navigate(['/settings']);
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
