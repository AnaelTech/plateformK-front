import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, catchError, of, Observable } from 'rxjs';
import { UserService } from '../../../shared/services/user.service';
import { BookingService } from '../../../shared/services/booking.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import { CoursService } from '../../../shared/services/cours.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AvailabilityService } from '../../../shared/services/availability.service';
import { Availability, CreateAvailabilityRequest, UpdateAvailabilityRequest } from '../../../shared/models/Availability';
import { DashboardNavbarComponent } from '../../../shared/components/dashboard-navbar/dashboard-navbar.component';

interface Course {
  id: number;
  student: string;
  date: Date;
  duration: number;
  subject: string;
  status: 'confirmed' | 'pending' | 'completed';
  price: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardNavbarComponent],
  templateUrl: './components/teacher-dashboard.component.html',
})
export class TeacherDashboardComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly bookingService = inject(BookingService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly coursService = inject(CoursService);
  private readonly authService = inject(AuthService);
  private readonly availabilityService = inject(AvailabilityService);

  activeTab: 'overview' | 'courses' | 'students' | 'invoices' | 'calendar' =
    'overview';

  // Loading and error states
  loading = signal(false);
  error = signal<string | null>(null);

  // Availability management
  availabilities = signal<Availability[]>([]);
  showAvailabilityModal = signal(false);
  editingAvailability = signal<Availability | null>(null);

  // Calendar data
  currentMonth = signal(new Date());
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Availability form data
  availabilityFormData = signal<CreateAvailabilityRequest>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    price: 25
  });

  // Computed calendar dates
  calendarDates = computed(() => {
    const month = this.currentMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || dates.length % 7 !== 0) {
      dates.push({
        date: new Date(currentDate),
        dateString: currentDate.toISOString().split('T')[0],
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === monthIndex,
        isToday: currentDate.toDateString() === new Date().toDateString()
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  });

  // Current user for navbar
  currentUser = signal<any>(null);

  // Data signals
  stats = signal({
    totalStudents: 0,
    monthlyRevenue: 0,
    pendingCourses: 0,
    completedCourses: 0,
  });

  students = signal<any[]>([]);
  parents = signal<any[]>([]);
  courses = signal<any[]>([]);
  invoices = signal<any[]>([]);

  // Computed properties for template
  recentCourses = signal<any[]>([]);
  pendingInvoices = signal<any[]>([]);

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
    this.loadAvailabilities();
  }

  private loadCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (error) => {
        console.error('Failed to load current user:', error);
      },
    });
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Charger parents et élèves en parallèle, puis les autres données
    forkJoin({
      parents: this.loadParents(),
      students: this.loadStudents(),
    }).subscribe({
      next: ({ parents, students }) => {
        // Charger les parents pour chaque élève
        this.loadParentsForStudents().subscribe({
          next: () => {
            // Une fois parents et élèves chargés, charger les autres données en parallèle
            forkJoin({
              stats: this.loadStats(),
              courses: this.loadCourses(),
              invoices: this.loadInvoices(),
            }).subscribe({
              next: () => {
                this.updateComputedData();
                this.loading.set(false);
              },
              error: (error) => {
                console.error('Failed to load dashboard data:', error);
                this.error.set('Erreur lors du chargement des données');
                this.loading.set(false);
              },
            });
          },
          error: (error) => {
            console.error('Failed to load parents for students:', error);
            // Continue without parents
            forkJoin({
              stats: this.loadStats(),
              courses: this.loadCourses(),
              invoices: this.loadInvoices(),
            }).subscribe({
              next: () => {
                this.updateComputedData();
                this.loading.set(false);
              },
              error: (error) => {
                console.error('Failed to load dashboard data:', error);
                this.error.set('Erreur lors du chargement des données');
                this.loading.set(false);
              },
            });
          },
        });
      },
      error: (error) => {
        console.error('Failed to load parents and students:', error);
        this.error.set('Erreur lors du chargement des parents et élèves');
        this.loading.set(false);
      },
    });
  }

  private loadStats(): Observable<any> {
    return forkJoin({
      bookingStats: this.bookingService.getBookingStats(),
      studentsCount: this.userService.getUsers(0, 1000),
    }).pipe(
      map(({ bookingStats, studentsCount }) => {
        // Calculate stats from booking data
        this.stats.set({
          totalStudents:
            studentsCount?.content.filter((u: any) => u.typeUser === 'ELEVE')
              .length || 0,
          monthlyRevenue: 0, // Will be calculated after courses are loaded
          pendingCourses: bookingStats?.pendingBookings || 0,
          completedCourses: bookingStats?.completedBookings || 0,
        });
        return bookingStats;
      }),
      catchError((error) => {
        console.error('Failed to load stats:', error);
        // Set default stats on error
        this.stats.set({
          totalStudents: 0,
          monthlyRevenue: 0,
          pendingCourses: 0,
          completedCourses: 0,
        });
        return of(null);
      })
    );
  }

  private loadParents(): Observable<any[]> {
    return this.userService.getUsers(0, 1000).pipe(
      map((response) => {
        const parents =
          response?.content.filter((u: any) => u.typeUser === 'PARENT') || [];
        this.parents.set(parents);
        return parents;
      }),
      catchError((error) => {
        console.error('Failed to load parents:', error);
        this.parents.set([]);
        return of([]);
      })
    );
  }

  private loadStudents(): Observable<any[]> {
    return this.userService.getUsers(0, 100).pipe(
      map((response) => {
        const eleves =
          response?.content
            .filter((u: any) => u.typeUser === 'ELEVE')
            .map((eleve: any) => ({
              ...eleve,
              name: `${eleve.firstName} ${eleve.lastName}`, // Combiner prénom et nom
              level: this.getStudentLevel(eleve), // Ajouter le niveau de l'élève
              parent: [], // Will be loaded separately
              nextSession: this.getNextSession(eleve), // Ajouter la prochaine session
            })) || [];
        this.students.set(eleves);
        return eleves;
      }),
      catchError((error) => {
        console.error('Failed to load students:', error);
        this.students.set([]);
        return of([]);
      })
    );
  }

  private loadCourses(): Observable<any[]> {
    return this.bookingService.getBookings(0, 50).pipe(
      map((response) => {
        const transformedCourses =
          response?.content.map((booking: any) => ({
            id: booking.id, // Use booking.id
            student: booking.eleveName, // Use booking.eleveName
            date: new Date(booking.coursDate),
            duration: booking.coursDureeMinutes / 60,
            subject: booking.coursMatiere || booking.coursTitre,
            status: this.mapBookingStatus(booking.status),
            price: booking.coursTarif || 0,
          })) || [];
        this.courses.set(transformedCourses);
        return transformedCourses;
      }),
      catchError((error) => {
        console.error('Failed to load courses:', error);
        this.courses.set([]);
        return of([]);
      })
    );
  }

  private loadInvoices(): Observable<any[]> {
    return this.invoiceService.getMyInvoices().pipe(
      map((invoices) => {
        this.invoices.set(invoices || []);
        return invoices || [];
      }),
      catchError((error) => {
        console.error('Failed to load invoices:', error);
        this.invoices.set([]);
        return of([]);
      })
    );
  }

  private loadAvailabilities(): void {
    if (!this.currentUser()) return;

    this.availabilityService.getAvailabilitiesByTeacher(this.currentUser().id).subscribe({
      next: (availabilities) => {
        this.availabilities.set(availabilities);
      },
      error: (error) => {
        console.error('Failed to load availabilities:', error);
        this.availabilities.set([]);
      }
    });
  }

  private updateComputedData(): void {
    // Update recent courses (last 3)
    this.recentCourses.set(this.courses().slice(0, 3));

    // Update pending invoices
    this.pendingInvoices.set(
      this.invoices().filter(
        (inv: any) => inv.statut === 'pending' || inv.statut === 'overdue'
      )
    );

    // Calculate monthly revenue from all completed courses
    const monthlyRevenue = this.courses()
      .filter(course => course.status === 'completed')
      .reduce((total, course) => total + (course.price || 0), 0);

    // Update stats to reflect actual pending courses count and monthly revenue
    this.stats.update(stats => ({
      ...stats,
      pendingCourses: this.courses().filter(course => course.status === 'pending').length,
      monthlyRevenue: monthlyRevenue
    }));
  }

  private getStudentLevel(eleve: any): string {
    // Logique pour déterminer le niveau de l'élève basé sur l'âge
    if (!eleve.birthDate) return 'Niveau non défini';

    const birthYear = new Date(eleve.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    // Tableau des niveaux scolaires avec leurs seuils d'âge minimum
    const levelThresholds = [
      { minAge: 18, level: 'Terminale ou +' },
      { minAge: 17, level: 'Terminale' },
      { minAge: 16, level: '1ère' },
      { minAge: 15, level: 'Seconde' },
      { minAge: 14, level: '3ème' },
      { minAge: 13, level: '4ème' },
      { minAge: 12, level: '5ème' },
      { minAge: 11, level: '6ème' },
    ];

    // Trouver le premier seuil que l'âge atteint
    const matchingLevel = levelThresholds.find(
      (threshold) => age >= threshold.minAge
    );
    return matchingLevel?.level || 'CM2 ou -';
  }

  private loadParentsForStudents(): Observable<void> {
    const students = this.students();
    if (students.length === 0) return of(void 0);

    const parentRequests = students.map((student) =>
      this.userService.getParentsByStudentId(student.id).pipe(
        map((parents) => ({ studentId: student.id, parents })),
        catchError((error) => {
          console.error(`Failed to load parents for student ${student.id}:`, error);
          return of({ studentId: student.id, parents: [] });
        })
      )
    );

    return forkJoin(parentRequests).pipe(
      map((results) => {
        this.students.update((students) =>
          students.map((student) => {
            const result = results.find((r) => r.studentId === student.id);
            return {
              ...student,
              parent: result?.parents.map((p) => `${p.firstName} ${p.lastName}`).join(', ') || 'Non défini',
            };
          })
        );
      }),
      map(() => void 0)
    );
  }

  private getNextSession(eleve: any): Date | null {
    // Logique pour déterminer la prochaine session
    // Pour l'instant, on simule une prochaine session dans quelques jours
    const nextSession = new Date();
    nextSession.setDate(
      nextSession.getDate() + Math.floor(Math.random() * 7) + 1
    ); // 1-7 jours dans le futur
    return nextSession;
  }

  private getStudentNameById(eleveId: number): string {
    // Chercher le nom de l'élève dans la liste des élèves chargés
    const eleve = this.students().find((s: any) => s.id === eleveId);
    return eleve ? eleve.name : `Élève ${eleveId}`;
  }

  private mapBookingStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
    return statusMap[status] || 'pending';
  }

  setActiveTab(
    tab: 'overview' | 'courses' | 'students' | 'invoices' | 'calendar'
  ): void {
    this.activeTab = tab;
  }

  validateCourse(courseId: number): void {
    this.bookingService.confirmBooking(courseId, { statut: 'CONFIRMED' }).subscribe({
      next: () => {
        // Refresh dashboard data to reflect changes
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Failed to validate course:', error);
      },
    });
  }

  completeCourse(courseId: number): void {
    this.bookingService.completeBooking(courseId).subscribe({
      next: () => {
        // Refresh dashboard data to reflect changes
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Failed to complete course:', error);
      },
    });
  }

  cancelCourse(courseId: number): void {
    this.bookingService.cancelBooking(courseId).subscribe({
      next: () => {
        // Refresh dashboard data to reflect changes
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Failed to cancel course:', error);
      },
    });
  }

  sendInvoice(invoiceId: number): void {
    this.invoiceService.sendInvoiceByEmail(invoiceId).subscribe({
      next: () => {
        console.log('Invoice sent successfully');
        // Refresh dashboard data to reflect changes
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Failed to send invoice:', error);
      },
    });
  }

  downloadInvoice(invoiceId: number): void {
    this.invoiceService.getInvoicePdf(invoiceId).subscribe({
      next: (blob) => {
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        a.click();
        globalThis.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Failed to download invoice:', error);
      },
    });
  }

  onSettings(): void {
    console.log('Settings clicked');
    // TODO: Implement settings navigation
  }

  onLogout(): void {
    this.userService.clearCache();
    this.authService.logout('/');
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      confirmed: 'Confirmé',
      pending: 'En attente',
      completed: 'Terminé',
      paid: 'Payée',
      overdue: 'En retard',
    };
    return labels[status] || status;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  }

  // Availability management methods
  saveAvailability(): void {
    if (!this.currentUser()) return;

    if (this.editingAvailability()) {
      // Update existing availability
      const updateRequest: UpdateAvailabilityRequest = {
        date: this.availabilityFormData().date,
        startTime: this.availabilityFormData().startTime,
        endTime: this.availabilityFormData().endTime,
        subject: this.availabilityFormData().subject,
        price: this.availabilityFormData().price
      };

      this.availabilityService.updateAvailability(this.editingAvailability()!.id, updateRequest).subscribe({
        next: () => {
          this.loadAvailabilities();
          this.closeAvailabilityModal();
        },
        error: (error) => {
          console.error('Failed to update availability:', error);
        }
      });
    } else {
      // Create new availability
      const createRequest: CreateAvailabilityRequest = {
        ...this.availabilityFormData()
      };

      this.availabilityService.createAvailability(createRequest).subscribe({
        next: () => {
          this.loadAvailabilities();
          this.closeAvailabilityModal();
        },
        error: (error) => {
          console.error('Failed to create availability:', error);
        }
      });
    }
  }

  editAvailability(availability: Availability): void {
    this.editingAvailability.set(availability);
    this.availabilityFormData.set({
      date: availability.date,
      startTime: availability.startTime,
      endTime: availability.endTime,
      subject: availability.subject,
      price: availability.price
    });
    this.showAvailabilityModal.set(true);
  }

  deleteAvailability(availabilityId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      this.availabilityService.deleteAvailability(availabilityId).subscribe({
        next: () => {
          this.loadAvailabilities();
        },
        error: (error) => {
          console.error('Failed to delete availability:', error);
        }
      });
    }
  }

  closeAvailabilityModal(): void {
    this.showAvailabilityModal.set(false);
    this.editingAvailability.set(null);
    this.availabilityFormData.set({
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      subject: '',
      price: 25
    });
  }

  // Calendar methods
  selectDate(dateInfo: any): void {
    // Open modal with selected date pre-filled
    this.availabilityFormData.update(data => ({
      ...data,
      date: dateInfo.dateString
    }));
    this.showAvailabilityModal.set(true);
  }

  getAvailabilitiesForDate(dateString: string): Availability[] {
    return this.availabilities().filter(availability => availability.date === dateString);
  }

  openAvailabilityModal(): void {
    this.showAvailabilityModal.set(true);
  }

  previousMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }
}
