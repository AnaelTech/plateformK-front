import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, catchError, of, Observable, interval, Subscription } from 'rxjs';
import { UserService } from '../../../shared/services/user.service';
import { BookingService } from '../../../shared/services/booking.service';
import {
  InvoiceService,
  Invoice,
  CreateInvoiceRequest,
} from '../../../shared/services/invoice.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AvailabilityService } from '../../../shared/services/availability.service';
import { InvitationService } from '../../../shared/services/invitation.service';
import { CoursService } from '../../../shared/services/cours.service';
import { TypeUser, User } from '../../../shared/models/User';

type ExtendedUser = User & {
  name: string;
  level: string;
  parent: string;
  nextSession: Date | null;
};
import {
  Availability,
  CreateAvailabilityRequest,
  UpdateAvailabilityRequest,
  AvailabilityFormData,
} from '../../../shared/models/Availability';
import { CompletedUnbilledCours } from '../../../shared/models/Cours';
import { DashboardNavbarComponent } from '../../../shared/components/dashboard-navbar/dashboard-navbar.component';
import { TabItem } from '../../../shared/models/TabItem';
import { Tab } from '../parent/parent-dashboard';
import { DashboardTabsComponent } from '../../../shared/components/dashboard-tabs/dashboard-tabs';
import {
  FeedbackModalComponent,
  FeedbackModalData,
} from '../../../shared/components/feedback-modal/feedback-modal.component';
import { BookingStatus, Booking } from '../../../shared/models/Booking';
import { BookingDisplay } from '../../../shared/models/Parent';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import {
  getStatusColor,
  getStatusLabel,
} from '../../../shared/utils/status.utils';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashboardNavbarComponent,
    DashboardTabsComponent,
    FeedbackModalComponent,
  ],
  templateUrl: './components/teacher-dashboard.component.html',
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly bookingService = inject(BookingService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly authService = inject(AuthService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly invitationService = inject(InvitationService);
  private readonly coursService = inject(CoursService);

  private readonly _bookings = signal<BookingDisplay[]>([]);

  readonly upcomingBookings = computed(() =>
    this._bookings().filter(
      (b) =>
        b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.PENDING,
    ),
  );

  readonly Tab = Tab;

  activeTab = signal('overview');

  readonly tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Tableau de bord',
      mobileLabel: 'Accueil',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      id: 'courses',
      label: 'Cours',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      id: 'students',
      label: 'Élèves',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'calendar',
      label: 'Planning',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
  ];

  private availabilityRefreshSubscription: Subscription | undefined;

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
  availabilityFormData = signal<AvailabilityFormData>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    price: 25,
  });

  // Invitation management
  showInvitationModal = signal(false);
  invitationEmail = signal('');
  invitationLoading = signal(false);
  invitationSuccess = signal<string | null>(null);
  invitationError = signal<string | null>(null);

  // Feedback modal management
  showFeedbackModal = signal(false);
  selectedBookingId = signal<number | null>(null);

  // Completed unbilled courses management
  completedUnbilledCours = signal<CompletedUnbilledCours[]>([]);
  selectedCoursForInvoice = signal<Set<number>>(new Set());
  showCreateInvoiceModal = signal(false);
  invoiceCreationLoading = signal(false);
  invoiceCreationError = signal<string | null>(null);
  invoiceDescription = signal('');
  invoiceNotes = signal('');
  invoicePaymentDelayDays = signal(30);

  // Computed: group completed unbilled courses by parent
  completedCoursByParent = computed(() => {
    const courses = this.completedUnbilledCours();
    const grouped = new Map<
      number,
      {
        parentId: number;
        parentName: string;
        parentEmail: string;
        courses: CompletedUnbilledCours[];
        totalAmount: number;
      }
    >();

    for (const cours of courses) {
      const existing = grouped.get(cours.parentId);
      if (existing) {
        existing.courses.push(cours);
        existing.totalAmount += cours.tarif;
      } else {
        grouped.set(cours.parentId, {
          parentId: cours.parentId,
          parentName: cours.parentName,
          parentEmail: cours.parentEmail,
          courses: [cours],
          totalAmount: cours.tarif,
        });
      }
    }

    return Array.from(grouped.values());
  });

  // Computed: selected courses details for invoice modal
  selectedCoursDetails = computed(() => {
    const selectedIds = this.selectedCoursForInvoice();
    const allCourses = this.completedUnbilledCours();
    return allCourses.filter((c) => selectedIds.has(c.coursId));
  });

  // Computed: total amount for selected courses
  selectedCoursTotal = computed(() => {
    return this.selectedCoursDetails().reduce((sum, c) => sum + c.tarif, 0);
  });

  // Computed: parent info for selected courses (assumes all selected courses are for the same parent)
  selectedCoursParent = computed(() => {
    const details = this.selectedCoursDetails();
    if (details.length === 0) return null;
    return {
      parentId: details[0].parentId,
      parentName: details[0].parentName,
      parentEmail: details[0].parentEmail,
    };
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDateCopy = new Date(currentDate);
      currentDateCopy.setHours(0, 0, 0, 0);

      dates.push({
        date: new Date(currentDate),
        dateString: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === monthIndex,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isPast: currentDateCopy < today,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  });

  // Current user for navbar
  currentUser = signal<User | null>(null);

  // Data signals
  stats = signal({
    totalStudents: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    completedBookings: 0,
  });

  students = signal<ExtendedUser[]>([]);
  parents = signal<User[]>([]);
  invoices = signal<Invoice[]>([]);

  // Computed properties for template
  pendingInvoices = signal<Invoice[]>([]);
  upcomingAvailabilities = computed<Availability[]>(() => {
    const allAvailabilities = this.availabilities();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = allAvailabilities
      .filter(
        (availability) =>
          new Date(availability.date) >= today && availability.isAvailable,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    return upcoming;
  });

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
    this.loadCompletedUnbilledCours();

    // Rafraîchir les disponibilités toutes les 30 secondes
    this.availabilityRefreshSubscription = interval(30000).subscribe(() => {
      if (this.currentUser()) {
        this.loadAvailabilities();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.availabilityRefreshSubscription) {
      this.availabilityRefreshSubscription.unsubscribe();
    }
  }

  private loadCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loadAvailabilities();
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
      next: () => {
        // Charger les parents pour chaque élève
        this.loadParentsForStudents().subscribe({
          next: () => {
            // Une fois parents et élèves chargés, charger les autres données en parallèle
            forkJoin({
              stats: this.loadStats(),
              bookings: this.loadBookings(),
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
              bookings: this.loadBookings(),
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

  private loadStats(): Observable<unknown> {
    return forkJoin({
      bookingStats: this.bookingService.getBookingStats(),
      studentsCount: this.userService.getUsers(0, 1000),
    }).pipe(
      map(({ bookingStats, studentsCount }) => {
        // Calculate stats from booking data
        this.stats.set({
          totalStudents:
            studentsCount?.data.filter((u: unknown) => (u as User).typeUser === 'ELEVE')
              .length || 0,
          monthlyRevenue: 0, // Will be calculated after bookings are loaded
          pendingBookings: bookingStats?.pendingBookings || 0,
          completedBookings: bookingStats?.completedBookings || 0,
        });
        return bookingStats;
      }),
      catchError((error) => {
        console.error('Failed to load stats:', error);
        // Set default stats on error
        this.stats.set({
          totalStudents: 0,
          monthlyRevenue: 0,
          pendingBookings: 0,
          completedBookings: 0,
        });
        return of(null);
      }),
    );
  }

  private loadParents(): Observable<unknown[]> {
    return this.userService.getUsers(0, 1000).pipe(
      map((response) => {
        const parents =
          response?.data.filter((u: unknown) => (u as User).typeUser === 'PARENT') || [];
        this.parents.set(parents);
        return parents;
      }),
      catchError((error) => {
        console.error('Failed to load parents:', error);
        this.parents.set([]);
        return of([]);
      }),
    );
  }

  private loadStudents(): Observable<unknown[]> {
    return this.userService.getUsers(0, 100).pipe(
      map((response) => {
        const eleves =
          response?.data
            .filter((u: unknown) => (u as User).typeUser === 'ELEVE')
            .map((eleve: unknown) => ({
              ...(eleve as User),
              name: `${(eleve as User).firstName} ${(eleve as User).lastName}`,
              level: this.getStudentLevel(eleve as User),
              parent: '',
              nextSession: null,
            })) || [];
        this.students.set(eleves);
        return eleves;
      }),
      catchError((error) => {
        console.error('Failed to load students:', error);
        this.students.set([]);
        return of([]);
      }),
    );
  }

  private loadBookings(): Observable<BookingDisplay[]> {
    return this.bookingService.getBookings(0, 50).pipe(
      map((response) => {
        const transformedBookings: BookingDisplay[] =
          response?.data.map((booking: unknown) => ({
            id: (booking as Booking).id,
            coursId: (booking as Booking).coursId,
            eleveId: (booking as Booking).eleveId,
            child: (booking as Booking).eleveName,
            date: new Date((booking as Booking).coursDate),
            duration: (booking as Booking).coursDureeMinutes / 60,
            subject: (booking as Booking).coursMatiere || (booking as Booking).coursTitre,
            teacher: '',
            status: (booking as Booking).status as BookingStatus,
            price: (booking as Booking).coursTarif || 0,
          })) || [];

        this._bookings.set(transformedBookings);
        return transformedBookings;
      }),
      catchError((error) => {
        console.error('Failed to load bookings:', error);
        this._bookings.set([]);
        return of([]);
      }),
    );
  }

  private loadInvoices(): Observable<Invoice[]> {
    return this.invoiceService.getMyInvoices().pipe(
      map((invoices) => {
        // Filtrer uniquement les factures de type TEACHER_INVOICE
        const teacherInvoices = invoices.filter(
          (inv) => inv.invoiceType === 'TEACHER_INVOICE',
        );
        this.invoices.set(teacherInvoices || []);
        return teacherInvoices || [];
      }),
      catchError((error) => {
        console.error('Failed to load invoices:', error);
        this.invoices.set([]);
        return of([]);
      }),
    );
  }

  private loadAvailabilities(): void {
    if (!this.currentUser()) {
      return;
    }

    this.availabilityService
      .getAvailabilitiesByTeacher((this.currentUser() as User).id)
      .subscribe({
        next: (availabilities) => {
          this.availabilities.set(availabilities);
        },
        error: (error) => {
          console.error('Failed to load availabilities:', error);
          this.availabilities.set([]);
        },
      });
  }

  private updateComputedData(): void {
    // Update nextSession for all students
    this.updateStudentsNextSession();

    // Update pending invoices
    this.pendingInvoices.set(
      this.invoices().filter((inv: Invoice) => !inv.isPaid),
    );

    // Calculate monthly revenue from all completed bookings
    const monthlyRevenue = this._bookings()
      .filter((booking) => booking.status === BookingStatus.COMPLETED)
      .reduce((total, booking) => total + (booking.price || 0), 0);

    // Update stats to reflect actual pending bookings count and monthly revenue
    this.stats.update((stats) => ({
      ...stats,
      pendingBookings: this._bookings().filter(
        (booking) => booking.status === BookingStatus.PENDING,
      ).length,
      monthlyRevenue: monthlyRevenue,
    }));
  }

  private getStudentLevel(eleve: User): string {
    if (!eleve.birthDate) return 'Niveau non défini';

    const birthYear = new Date(eleve.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

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

    const matchingLevel = levelThresholds.find(
      (threshold) => age >= threshold.minAge,
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
          console.error(
            `Failed to load parents for student ${student.id}:`,
            error,
          );
          return of({ studentId: student.id, parents: [] });
        }),
      ),
    );

    return forkJoin(parentRequests).pipe(
      map((results) => {
        this.students.update((students) =>
          students.map((student) => {
            const result = results.find((r) => r.studentId === student.id);
            return {
              ...student,
              parent:
                result?.parents
                  .map((p) => `${(p as User).firstName} ${(p as User).lastName}`)
                  .join(', ') || 'Non défini',
            };
          }),
        );
      }),
      map(() => void 0),
    );
  }

  private updateStudentsNextSession(): void {
    const updatedStudents = this.students().map((eleve: ExtendedUser) => ({
      ...eleve,
      nextSession: this.getNextSession(eleve),
    }));
    this.students.set(updatedStudents);
  }

  private getNextSession(eleve: ExtendedUser): Date | null {
    const now = new Date();

    const studentBookings = this._bookings().filter(
      (booking: BookingDisplay) => {
        return (
          booking.child === `${eleve.firstName} ${eleve.lastName}` &&
          (booking.status === BookingStatus.CONFIRMED ||
            booking.status === BookingStatus.PENDING)
        );
      },
    );

    if (studentBookings.length === 0) {
      return null;
    }

    const futureBookings = studentBookings
      .filter((booking: BookingDisplay) => new Date(booking.date) > now)
      .sort(
        (a: BookingDisplay, b: BookingDisplay) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    if (futureBookings.length > 0) {
      return new Date(futureBookings[0].date);
    }

    return null;
  }

  setActiveTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  validateBooking(bookingId: number): void {
    this.bookingService
      .confirmBooking(bookingId, { statut: BookingStatus.CONFIRMED })
      .subscribe({
        next: () => {
          this.loadDashboardData();
        },
        error: (error) => {
          console.error('Failed to validate booking:', error);
        },
      });
  }

  completeBooking(bookingId: number): void {
    this.selectedBookingId.set(bookingId);
    this.showFeedbackModal.set(true);
  }

  onFeedbackSubmit(data: FeedbackModalData): void {
    const bookingId = this.selectedBookingId();
    if (!bookingId) return;

    this.bookingService.completeBooking(bookingId, data).subscribe({
      next: () => {
        this.showFeedbackModal.set(false);
        this.selectedBookingId.set(null);
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Failed to complete booking:', error);
      },
    });
  }

  onFeedbackCancel(): void {
    this.showFeedbackModal.set(false);
    this.selectedBookingId.set(null);
  }

  cancelBooking(bookingId: number): void {
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Failed to cancel booking:', error);
      },
    });
  }

  viewBookingDetails(bookingId: number): void {
    // TODO: Implémenter l'affichage des détails du booking
    console.log('View booking details:', bookingId);
  }

  sendInvoice(invoiceId: number): void {
    this.invoiceService.sendInvoiceByEmail(invoiceId).subscribe({
      next: () => {
        console.log('Invoice sent successfully');
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
  }

  onLogout(): void {
    this.userService.clearCache();
    this.authService.logout('/');
  }

  getStatusColor = getStatusColor;
  getStatusLabel = getStatusLabel;

  formatDate = (date: Date | string) =>
    new DateFormatPipe().transform(date, 'date');
  formatDateTime = (date: Date | string) =>
    new DateFormatPipe().transform(date, 'datetime');

  // Availability management methods
  saveAvailability(): void {
    if (!this.currentUser()) return;

    if (this.editingAvailability()) {
      const updateRequest: UpdateAvailabilityRequest = {
        date: this.availabilityFormData().date,
        startTime: this.availabilityFormData().startTime,
        endTime: this.availabilityFormData().endTime,
        subject: this.availabilityFormData().subject,
        price: this.availabilityFormData().price,
      };

      this.availabilityService
        .updateAvailability(this.editingAvailability()!.id, updateRequest)
        .subscribe({
          next: () => {
            this.loadAvailabilities();
            this.closeAvailabilityModal();
          },
          error: (error) => {
            console.error('Failed to update availability:', error);
            const userFriendlyMessage = this.getUserFriendlyErrorMessage(error);
            alert(userFriendlyMessage);
          },
        });
    } else {
      const createRequest: CreateAvailabilityRequest = {
        teacherId: (this.currentUser() as User).id,
        ...this.availabilityFormData(),
      };

      this.availabilityService.createAvailability(createRequest).subscribe({
        next: () => {
          this.loadAvailabilities();
          this.closeAvailabilityModal();
        },
        error: (error) => {
          console.error('Failed to create availability:', error);
          const userFriendlyMessage = this.getUserFriendlyErrorMessage(error);
          alert(userFriendlyMessage);
        },
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
      price: availability.price,
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
          const userFriendlyMessage = this.getUserFriendlyErrorMessage(error);
          alert(userFriendlyMessage);
        },
      });
    }
  }

  closeAvailabilityModal(): void {
    this.showAvailabilityModal.set(false);
    this.editingAvailability.set(null);
    this.availabilityFormData.set({
      date: '',
      startTime: '',
      endTime: '',
      subject: '',
      price: 0,
    });
  }

  private getUserFriendlyErrorMessage(error: unknown): string {
    const err = error as { error?: { message?: string }; message?: string };
    const errorMessage = err.error?.message || err.message || '';

    if (
      errorMessage.includes('Time slot overlaps with existing availability')
    ) {
      const timeMatch = errorMessage.match(
        /from (\d{2}:\d{2}) to (\d{2}:\d{2})/,
      );
      if (timeMatch) {
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        return `Vous avez déjà une disponibilité de ${startTime} à ${endTime} ce jour-là. Veuillez choisir un autre horaire.`;
      }
      return 'Vous avez déjà une disponibilité qui chevauche cet horaire. Veuillez choisir un autre créneau.';
    }

    if (
      errorMessage.includes('Cannot update availability to a past date') ||
      errorMessage.includes('past date')
    ) {
      return 'Vous ne pouvez pas créer ou modifier une disponibilité pour une date passée.';
    }

    if (errorMessage.includes('Price cannot be negative')) {
      return 'Le prix ne peut pas être négatif.';
    }

    if (errorMessage.includes('End time must be after start time')) {
      return "L'heure de fin doit être après l'heure de début.";
    }

    return `Erreur : ${errorMessage || "Une erreur inattendue s'est produite."}`;
  }

  // Calendar methods
  selectDate(dateInfo: Record<string, unknown>): void {
    this.availabilityFormData.update((data) => ({
      ...data,
      date: dateInfo['dateString'] as string,
    }));
    this.showAvailabilityModal.set(true);
  }

  getAvailabilitiesForDate(dateString: string): Availability[] {
    return this.availabilities().filter(
      (availability) => availability.date === dateString,
    );
  }

  openAvailabilityModal(): void {
    this.showAvailabilityModal.set(true);
  }

  previousMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(
      new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  nextMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(
      new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  onTabChange(tabId: string) {
    this.activeTab.set(tabId);
  }

  // Invitation methods
  openInvitationModal(): void {
    this.showInvitationModal.set(true);
    this.invitationEmail.set('');
    this.invitationSuccess.set(null);
    this.invitationError.set(null);
  }

  closeInvitationModal(): void {
    this.showInvitationModal.set(false);
    this.invitationEmail.set('');
    this.invitationLoading.set(false);
    this.invitationSuccess.set(null);
    this.invitationError.set(null);
  }

  sendParentInvitation(): void {
    const email = this.invitationEmail().trim();

    if (!email) {
      this.invitationError.set('Veuillez saisir une adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.invitationError.set('Adresse email invalide');
      return;
    }

    this.invitationLoading.set(true);
    this.invitationError.set(null);

    this.invitationService
      .sendInvitation({
        email,
        targetRole: 'PARENT' as TypeUser,
      })
      .subscribe({
        next: () => {
          this.invitationLoading.set(false);
          this.invitationSuccess.set(
            `Invitation envoyée avec succès à ${email}`,
          );
          this.invitationEmail.set('');
          setTimeout(() => {
            if (this.invitationSuccess()) {
              this.closeInvitationModal();
            }
          }, 3000);
        },
        error: (error) => {
          this.invitationLoading.set(false);
          const err = error as { error?: { message?: string }; message?: string };
          const errorMessage =
            err.error?.message ||
            err.message ||
            "Erreur lors de l'envoi de l'invitation";
          this.invitationError.set(errorMessage);
        },
      });
  }

  // Completed unbilled courses methods
  private loadCompletedUnbilledCours(): void {
    this.coursService.getCompletedUnbilledCours().subscribe({
      next: (courses) => {
        this.completedUnbilledCours.set(courses);
      },
      error: (error) => {
        console.error('Failed to load completed unbilled courses:', error);
        this.completedUnbilledCours.set([]);
      },
    });
  }

  toggleCoursSelection(coursId: number): void {
    this.selectedCoursForInvoice.update((selected) => {
      const newSet = new Set(selected);
      if (newSet.has(coursId)) {
        newSet.delete(coursId);
      } else {
        newSet.add(coursId);
      }
      return newSet;
    });
  }

  selectAllCoursForParent(parentId: number): void {
    const parentCourses = this.completedUnbilledCours().filter(
      (c) => c.parentId === parentId,
    );
    const parentCoursIds = parentCourses.map((c) => c.coursId);
    const currentSelected = this.selectedCoursForInvoice();

    // Check if all courses for this parent are already selected
    const allSelected = parentCoursIds.every((id) => currentSelected.has(id));

    this.selectedCoursForInvoice.update((selected) => {
      const newSet = new Set(selected);
      if (allSelected) {
        // Deselect all courses for this parent
        parentCoursIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all courses for this parent (clear other selections first)
        newSet.clear();
        parentCoursIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  }

  isCoursSelected(coursId: number): boolean {
    return this.selectedCoursForInvoice().has(coursId);
  }

  areAllCoursSelectedForParent(parentId: number): boolean {
    const parentCourses = this.completedUnbilledCours().filter(
      (c) => c.parentId === parentId,
    );
    const currentSelected = this.selectedCoursForInvoice();
    return (
      parentCourses.length > 0 &&
      parentCourses.every((c) => currentSelected.has(c.coursId))
    );
  }

  openCreateInvoiceModal(): void {
    if (this.selectedCoursForInvoice().size === 0) {
      return;
    }
    this.invoiceCreationError.set(null);
    this.invoiceDescription.set('');
    this.invoiceNotes.set('');
    this.invoicePaymentDelayDays.set(30);
    this.showCreateInvoiceModal.set(true);
  }

  closeCreateInvoiceModal(): void {
    this.showCreateInvoiceModal.set(false);
    this.invoiceCreationError.set(null);
    this.invoiceCreationLoading.set(false);
  }

  createInvoice(): void {
    const selectedIds = Array.from(this.selectedCoursForInvoice());
    const parent = this.selectedCoursParent();

    if (selectedIds.length === 0 || !parent) {
      this.invoiceCreationError.set('Veuillez sélectionner au moins un cours');
      return;
    }

    this.invoiceCreationLoading.set(true);
    this.invoiceCreationError.set(null);

    const request: CreateInvoiceRequest = {
      coursIds: selectedIds,
      parentId: parent.parentId,
      description: this.invoiceDescription() || undefined,
      notes: this.invoiceNotes() || undefined,
      paymentDelayDays: this.invoicePaymentDelayDays(),
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: () => {
        this.invoiceCreationLoading.set(false);
        this.closeCreateInvoiceModal();
        this.selectedCoursForInvoice.set(new Set());
        // Refresh data
        this.loadCompletedUnbilledCours();
        this.loadInvoices().subscribe();
      },
        error: (error) => {
          this.invoiceCreationLoading.set(false);
          const err = error as { error?: { message?: string }; message?: string };
          const errorMessage =
            err.error?.message ||
            err.message ||
            'Erreur lors de la création de la facture';
          this.invoiceCreationError.set(errorMessage);
        },
    });
  }

  handleDateClick(date: Record<string, unknown>, event?: Event): void {
    if (!(date['isPast'] as boolean)) {
      this.selectDate(date);
      event?.preventDefault();
    }
  }

  formatCoursDate = (date: string) =>
    new DateFormatPipe().transform(date, 'sessionDate');
  getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('');
}
