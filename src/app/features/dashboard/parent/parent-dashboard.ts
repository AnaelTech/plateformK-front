import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { CoursService } from '../../../shared/services/cours.service';
import {
  InvoiceService,
  Invoice,
} from '../../../shared/services/invoice.service';
import { InvitationService } from '../../../shared/services/invitation.service';
import { TypeUser } from '../../../shared/models/User';
import {
  CoursSession,
  CoursStatus,
  CreateCoursRequest,
} from '../../../shared/models/Cours';
import { Booking, BookingStatus } from '../../../shared/models/Booking';
import { User } from '../../../shared/models/User';
import { DashboardNavbarComponent } from '../../../shared/components/dashboard-navbar/dashboard-navbar.component';
import { CalendarComponent } from '../../../shared/components/calendar/calendar.component';
import { AvailabilityService } from '../../../shared/services/availability.service';
import { AvailabilitySlot } from '../../../shared/models/Availability';
import { AuthService } from '../../../core/auth/services/auth.service';
import { BookingService } from '../../../shared/services/booking.service';
import {
  Child,
  BookingDisplay,
  SlotDisplay,
  Payment,
} from '../../../shared/models/Parent';
import { TabItem } from '../../../shared/models/TabItem';
import { DashboardTabsComponent } from '../../../shared/components/dashboard-tabs/dashboard-tabs';
import { BookingDetailsModalComponent } from '../../../shared/components/booking-details-modal/booking-details-modal.component';
import { environment } from '../../../../environments/environment';

export enum Tab {
  Overview = 'overview',
  Booking = 'booking',
  Children = 'children',
  Invoices = 'invoices',
  Payments = 'payments',
  Calendar = 'calendar',
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardNavbarComponent,
    CalendarComponent,
    DashboardTabsComponent,
    BookingDetailsModalComponent,
  ],
  templateUrl: './components/parent-dashboard.component.html',
})
export class ParentDashboardComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly coursService = inject(CoursService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly invitationService = inject(InvitationService);
  private readonly fb = inject(FormBuilder);

  readonly Tab = Tab;

  readonly activeTab = signal<Tab>(Tab.Overview);

  // Invitation management
  showInvitationModal = signal(false);
  invitationEmail = signal('');
  invitationLoading = signal(false);
  invitationSuccess = signal<string | null>(null);
  invitationError = signal<string | null>(null);

  // Add child management
  showAddChildOptions = signal(false);
  addChildMethod = signal<'manual' | 'invitation' | null>(null);
  showManualChildForm = signal(false);
  childFormLoading = signal(false);
  childFormSuccess = signal<string | null>(null);
  childFormError = signal<string | null>(null);

  // Child form
  childForm: FormGroup = this.fb.group({
    lastName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    ],
    firstName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    birthDate: ['', [Validators.required]],
    phoneNumber: ['', [Validators.pattern(/^(\+33|0)[1-9](\d{2}){4}$/)]],
  });

  readonly tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Tableau de bord',
      mobileLabel: 'Accueil',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      id: 'booking',
      label: 'Réservation',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      id: 'children',
      label: 'Mes enfants',
      mobileLabel: 'Enfants',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'payments',
      label: 'Paiements',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    },
  ];

  private readonly _children = signal<Child[]>([]);
  private readonly _availableSlots = signal<SlotDisplay[]>([]);
  private readonly _bookings = signal<BookingDisplay[]>([]);
  private readonly _invoices = signal<
    {
      id: number;
      student: string;
      date: string;
      dueDate: string;
      amount: number;
      status: 'paid' | 'pending' | 'overdue' | 'failed';
      invoiceType: 'CLIENT_INVOICE' | 'TEACHER_INVOICE';
      paidAt?: string;
      isPaid: boolean;
      isOverdue: boolean;
      teacher?: {
        id: number;
        firstName: string;
        lastName: string;
      };
    }[]
  >([]);
  private readonly _payments = signal<Payment[]>([]);

  readonly selectedChildId = signal<number | null>(null);
  readonly selectedSlotId = signal<number | null>(null);
  readonly selectedDate = signal<string | null>(null);
  readonly availabilities = signal<AvailabilitySlot[]>([]);

  // Booking details modal
  showBookingDetails = signal(false);
  selectedBookingForDetails = signal<Booking | null>(null);

  // Computed signal for filtered availabilities
  readonly availabilitiesForSelectedDate = computed(() => {
    const selectedDate = this.selectedDate();
    if (!selectedDate) return [];

    return this.availabilities().filter(
      (availability) => availability.date === selectedDate,
    );
  });

  readonly children = this._children.asReadonly();
  readonly availableSlots = this._availableSlots.asReadonly();
  readonly bookings = this._bookings.asReadonly();
  readonly invoices = this._invoices.asReadonly();
  readonly payments = this._payments.asReadonly();
  readonly currentUser = this.userService.currentUser;

  readonly upcomingBookings = computed(() =>
    this._bookings().filter(
      (b) =>
        b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.PENDING,
    ),
  );

  readonly pendingInvoices = computed(() =>
    this._invoices().filter((i) => !i.isPaid),
  );

  readonly stats = computed(() => ({
    upcomingBookings: this.upcomingBookings().length,
    totalSpent: this._invoices()
      .filter((i) => i.status === 'paid')
      .reduce((total, i) => total + i.amount, 0),
    pendingInvoices: this.pendingInvoices().length,
    completedSessions: this._bookings().filter(
      (b) => b.status === BookingStatus.COMPLETED,
    ).length,
  }));

  constructor() {
    // Effect to show add child options when no children on Children tab
    effect(() => {
      const hasNoChildren = this.children().length === 0;
      const isOnChildrenTab = this.activeTab() === Tab.Children;

      if (
        hasNoChildren &&
        isOnChildrenTab &&
        !this.showAddChildOptions() &&
        !this.showManualChildForm()
      ) {
        this.showAddChildOptions.set(true);
      }
    });
  }

  ngOnInit(): void {
    // Load initial data once on component init (not in effect to avoid loops)
    this.loadUserData();
    this.loadCoursData();
    this.loadInvoicesData();
    this.loadAvailabilities();
  }

  setActiveTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  isActiveTab(tab: Tab): boolean {
    return this.activeTab() === tab;
  }

  selectChild(childId: number): void {
    this.selectedChildId.set(childId);
  }

  selectSlot(slotId: number): void {
    this.selectedSlotId.set(slotId);
  }

  bookSlot(slotId: number): void {
    const childId = this.selectedChildId();
    if (!childId) {
      alert('Veuillez sélectionner un enfant');
      return;
    }

    const currentUser = this.currentUser();
    if (!currentUser) {
      alert('Utilisateur non connecté');
      return;
    }

    // Trouver la disponibilité correspondante
    const availability = this.availabilities().find((a) => a.id === slotId);
    if (!availability) {
      alert('Créneau non trouvé');
      return;
    }

    // Créer un cours basé sur la disponibilité (le teacherId vient de l'availability)
    const courseRequest: CreateCoursRequest = {
      titre: `Cours de ${availability.subject}`,
      matiere: availability.subject,
      dureeMinutes: availability.duration * 60,
      sessionDate: `${availability.date}T${availability.startTime}`,
      tarif: availability.price,
      teacherId: availability.teacherId, // Le professeur qui a créé la disponibilité
      statut: CoursStatus.PENDING,
    };

    // Créer le cours
    this.coursService.createCours(courseRequest).subscribe({
      next: (course) => {
        // Créer la réservation pour le cours créé
        const bookingRequest = {
          coursId: course.id,
          eleveId: childId,
          notes: `Réservation pour ${availability.subject} avec ${availability.teacherName}`,
        };

        this.bookingService.createBooking(bookingRequest).subscribe({
          next: (booking) => {
            this._bookings.update((bookings) =>
              bookings.map((b) =>
                b.id === booking.id
                  ? { ...b, status: BookingStatus.CONFIRMED }
                  : b,
              ),
            );

            // Marquer la disponibilité comme non disponible
            this.availabilityService
              .updateAvailability(slotId, { isAvailable: false })
              .subscribe({
                next: () => {
                  alert(
                    `Réservation effectuée pour ${availability.subject} le ${this.formatDate(availability.date)} à ${availability.startTime} avec ${availability.teacherName}`,
                  );
                  // Recharger les disponibilités et les cours pour refléter les changements
                  this.loadAvailabilities();
                  this.loadCoursData();
                },
                error: (error) => {
                  if (!environment.production) {
                    console.error(
                      'Erreur lors de la mise à jour de la disponibilité:',
                      error,
                    );
                  }
                  alert(
                    'Réservation créée mais erreur lors de la mise à jour de la disponibilité',
                  );
                  // Recharger quand même les cours en cas d'erreur
                  this.loadCoursData();
                },
              });
          },
          error: (error) => {
            if (!environment.production) {
              console.error('Erreur lors de la réservation:', error);
            }
            alert('Erreur lors de la création de la réservation');
          },
        });
      },
      error: (error) => {
        if (!environment.production) {
          console.error('Erreur lors de la création du cours:', error);
        }
        alert('Erreur lors de la création du cours');
      },
    });
  }

  viewBookingDetails(bookingId: number): void {
    // Try to find booking in local bookings first
    const localBooking = this._bookings().find((b) => b.id === bookingId);

    if (localBooking) {
      // Convert BookingDisplay to full Booking structure
      // For now, create minimal Booking object from BookingDisplay
      const fullBooking: Booking = {
        id: localBooking.id,
        coursId: localBooking.coursId,
        coursTitre: '', // Will be loaded if needed
        coursMatiere: localBooking.subject,
        coursDate: localBooking.date.toISOString(),
        coursDureeMinutes: localBooking.duration,
        coursTarif: localBooking.price,
        parentId: 0, // Will be loaded
        parentName: '',
        eleveId: localBooking.eleveId || 0,
        eleveName: localBooking.child,
        createdAt: '',
        updatedAt: '',
        notes: undefined,
        notionsCovered: undefined,
        teacherFeedback: undefined,
        status: localBooking.status,
      };

      // Load full details from API
      this.bookingService.getBookingById(bookingId).subscribe({
        next: (booking: Booking) => {
          this.selectedBookingForDetails.set(booking);
          this.showBookingDetails.set(true);
        },
        error: (error: Error) => {
          // Fallback to partial data if API fails
          console.error(
            'Failed to load full booking details, showing partial data:',
            error,
          );
          this.selectedBookingForDetails.set(fullBooking);
          this.showBookingDetails.set(true);
        },
      });
    }
  }

  closeBookingDetails(): void {
    this.showBookingDetails.set(false);
    this.selectedBookingForDetails.set(null);
  }

  cancelBooking(bookingId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this._bookings.update((bookings) =>
        bookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: BookingStatus.CANCELLED }
            : booking,
        ),
      );
    }
  }

  validateCourse(courseId: number): void {
    this.coursService
      .updateCours(courseId, { statut: CoursStatus.CONFIRMED })
      .subscribe({
        next: () => {
          this.loadCoursData();
        },
        error: (error) => {
          if (!environment.production) {
            console.error('Erreur lors de la validation:', error);
          }
        },
      });
  }

  completeCourse(courseId: number): void {
    this.coursService
      .updateCours(courseId, { statut: CoursStatus.COMPLETED })
      .subscribe({
        next: () => {
          this.loadCoursData();
        },
        error: (error) => {
          if (!environment.production) {
            console.error('Erreur lors de la finalisation:', error);
          }
        },
      });
  }

  cancelCourse(courseId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce cours ?')) {
      this.coursService
        .updateCours(courseId, { statut: CoursStatus.CANCELLED })
        .subscribe({
          next: () => {
            this.loadCoursData();
          },
          error: (error) => {
            if (!environment.production) {
              console.error("Erreur lors de l'annulation:", error);
            }
          },
        });
    }
  }

  sendInvoice(invoiceId: number): void {
    this.invoiceService.sendInvoiceByEmail(invoiceId).subscribe({
      next: () => {
        console.log('Invoice sent successfully');
        this.loadInvoicesData();
      },
      error: () => {
        //console.error('Failed to send invoice:');
      },
    });
  }

  downloadInvoice(invoiceId: number): void {
    this.invoiceService.getInvoicePdf(invoiceId).subscribe({
      next: (blob) => {
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();
        globalThis.URL.revokeObjectURL(url);
      },
      error: () => {
        //console.error('Failed to download invoice:');
      },
    });
  }

  payInvoice(invoiceId: number): void {
    // TODO: Intégrer ici la logique de paiement Stripe
    // Pour l'instant, on simule un paiement réussi
    if (confirm('Confirmer le paiement de cette facture ?')) {
      this.invoiceService.markInvoiceAsPaid(invoiceId).subscribe({
        next: () => {
          console.log('Invoice marked as paid successfully');
          this.loadInvoicesData();
          // TODO: Afficher une notification de succès
        },
        error: (error) => {
          console.error('Failed to mark invoice as paid:', error);
          // TODO: Afficher une notification d'erreur
        },
      });
    }
  }

  getStatusColor(status: string): string {
    const normalizedStatus = status?.toLowerCase();
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[normalizedStatus] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = status?.toLowerCase();
    const labels: Record<string, string> = {
      upcoming: 'À venir',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
      paid: 'Payée',
      pending: 'En attente',
      overdue: 'En retard',
      failed: 'Échoué',
    };
    return labels[normalizedStatus] || status;
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }

  onNavbarSettings(): void {
    alert('Redirection vers les paramètres...');
  }

  onNavbarLogout(): void {
    this.userService.clearCache();
    this.authService.logout('/');
  }

  private loadUserData(): void {
    this.userService.getCurrentUser().subscribe((user: User) => {
      const childrenMap = new Map<number, Child>();
      user.enfants?.forEach((child: User) => {
        const c: Child = {
          id: child.id,
          name: `${child.firstName} ${child.lastName}`,
          level: this.getStudentLevel(child),
          email: child.email,
          parent: `${user.firstName} ${user.lastName}`,
          nextSession: this.getNextSession(),
        };
        childrenMap.set(c.id, c);
      });
      this._children.set(Array.from(childrenMap.values()));
    });
  }

  private loadCoursData(): void {
    const currentParentId = this.currentUser()?.id;
    if (!currentParentId) return;

    // Charger les réservations du parent
    this.bookingService.getBookingsByParent(currentParentId).subscribe({
      next: (bookings) => {
        const childIds = this._children().map((c) => c.id);
        const bookingDisplays = bookings
          .filter((b) => b.eleveId && childIds.includes(b.eleveId))
          .map((b) => this.bookingToBookingDisplay(b));
        this._bookings.set(bookingDisplays);
      },
      error: (error) => {
        console.error('Failed to load bookings:', error);
        this._bookings.set([]);
      },
    });

    // Charger les cours disponibles (slots sans réservation)
    // Utiliser getAllCours et filtrer côté client les cours disponibles
    // Un cours est disponible si: eleveId === null (pas de booking) et statut === PENDING
    this.coursService.getAllCours(0, 100, 'sessionDate', 'ASC').subscribe({
      next: (response) => {
        const now = new Date();
        const slotsMap = new Map<number, SlotDisplay>();
        const slots = response.data
          .filter(
            (c: CoursSession) =>
              c.eleveId === null &&
              c.statut === CoursStatus.PENDING &&
              new Date(c.sessionDate) > now,
          )
          .map((c: CoursSession) => this.coursToSlotDisplay(c));
        slots.forEach((s: SlotDisplay) => slotsMap.set(s.id, s));
        this._availableSlots.set(Array.from(slotsMap.values()));
      },
      error: (error) => {
        console.error('Failed to load available slots:', error);
        this._availableSlots.set([]);
      },
    });
  }

  private loadInvoicesData(): void {
    this.invoiceService.getMyInvoices().subscribe((invoices) => {
      const formattedInvoices = invoices
        .filter((invoice) => invoice.invoiceType === 'CLIENT_INVOICE')
        .map((invoice) => ({
          id: invoice.id,
          student: invoice.studentName || 'Élève',
          date: invoice.creationDate,
          dueDate: invoice.dueDate,
          amount: invoice.totalAmount,
          status: this.mapInvoiceStatus(invoice),
          invoiceType: invoice.invoiceType,
          paidAt: invoice.paidAt,
          isPaid: invoice.isPaid,
          isOverdue: invoice.isOverdue,
          teacher: invoice.teacher
            ? {
                id: invoice.teacher.id,
                firstName: invoice.teacher.firstName,
                lastName: invoice.teacher.lastName,
              }
            : undefined,
        }));
      this._invoices.set(formattedInvoices);
    });
  }

  private mapInvoiceStatus(
    invoice: Invoice,
  ): 'paid' | 'pending' | 'overdue' | 'failed' {
    // Utiliser les booléens isPaid et isOverdue pour un mapping plus fiable
    if (invoice.isPaid) return 'paid';
    if (invoice.isOverdue) return 'overdue';

    // Fallback sur l'ancien système de statuts en cas de données manquantes
    const statusMap: Record<string, 'paid' | 'pending' | 'overdue' | 'failed'> =
      {
        PAID: 'paid',
        SENT: 'pending',
        OVERDUE: 'overdue',
        DRAFT: 'pending',
      };
    return statusMap[invoice.statut] || 'pending';
  }

  private coursToBookingDisplay(cours: CoursSession): BookingDisplay {
    // Note: cours.eleveId no longer exists in the new architecture
    // Student info should come from the associated booking
    // This method might not be used anymore since bookings come from BookingService
    return {
      id: cours.id,
      coursId: cours.id,
      eleveId: undefined, // No longer available on Cours
      child: 'Élève', // Would need to fetch from booking
      date: new Date(cours.sessionDate),
      subject: cours.matiere,
      teacher: 'Prof. Dubois',
      price: cours.tarif,
      duration: cours.dureeMinutes / 60,
      status: this.mapCoursStatusToBookingStatus(cours.statut),
    };
  }

  private bookingToBookingDisplay(booking: Booking): BookingDisplay {
    const child = this._children().find((c) => c.id === booking.eleveId);
    return {
      id: booking.id,
      coursId: booking.coursId,
      eleveId: booking.eleveId,
      child: child ? child.name : 'Élève',
      date: new Date(booking.coursDate),
      subject: booking.coursMatiere,
      teacher: booking.parentName, // Ou trouver le nom du professeur
      price: booking.coursTarif,
      duration: booking.coursDureeMinutes / 60,
      status: booking.status,
    };
  }

  private coursToSlotDisplay(cours: CoursSession): SlotDisplay {
    return {
      id: cours.id,
      date: new Date(cours.sessionDate),
      duration: cours.dureeMinutes / 60,
      subject: cours.matiere,
      price: cours.tarif,
      teacher: 'Prof. Dubois',
    };
  }

  private mapCoursStatusToBookingStatus(status: CoursStatus): BookingStatus {
    switch (status) {
      case CoursStatus.PENDING:
        return BookingStatus.PENDING;
      case CoursStatus.CONFIRMED:
        return BookingStatus.CONFIRMED;
      case CoursStatus.CANCELLED:
        return BookingStatus.CANCELLED;
      default:
        return BookingStatus.PENDING;
    }
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

  private getNextSession(): Date | undefined {
    const nextSession = new Date();
    nextSession.setDate(
      nextSession.getDate() + Math.floor(Math.random() * 7) + 1,
    );
    return nextSession;
  }

  private loadAvailabilities(): void {
    // Charger les disponibilités pour les prochains 30 jours
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    this.availabilityService
      .getAvailabilitiesByDateRange(startDate, endDate)
      .subscribe({
        next: (availabilities) => {
          this.availabilities.set(availabilities);
        },
        error: () => {
          //console.error('Failed to load availabilities:');
          this.availabilities.set([]);
        },
      });
  }

  onDateSelected(dateString: string): void {
    this.selectedDate.set(dateString);
  }

  showMobileMenu = signal(false);

  toggleMobileMenu() {
    this.showMobileMenu.update((value) => !value);
  }

  onTabChange(tabId: string) {
    const tab = Object.values(Tab).find((t) => t === tabId);
    if (tab) {
      this.activeTab.set(tab);
    }
  }

  // Add child methods
  proceedWithAddChild(): void {
    const method = this.addChildMethod();

    if (method === 'invitation') {
      // Ouvrir le modal d'invitation
      this.showAddChildOptions.set(false);
      this.openInvitationModal();
    } else if (method === 'manual') {
      // Afficher le formulaire manuel
      this.showAddChildOptions.set(false);
      this.showManualChildForm.set(true);
    }
  }

  cancelAddChild(): void {
    this.showAddChildOptions.set(false);
    this.addChildMethod.set(null);
    this.showManualChildForm.set(false);
    this.childForm.reset();
    this.childFormSuccess.set(null);
    this.childFormError.set(null);
  }

  submitChildForm(): void {
    if (this.childForm.invalid) {
      this.childFormError.set(
        'Veuillez remplir tous les champs obligatoires correctement',
      );
      Object.keys(this.childForm.controls).forEach((key) => {
        this.childForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.childFormLoading.set(true);
    this.childFormError.set(null);
    this.childFormSuccess.set(null);

    const currentUser = this.currentUser();
    if (!currentUser) {
      this.childFormError.set('Utilisateur non connecté');
      this.childFormLoading.set(false);
      return;
    }

    const request: import('../../../shared/models/child.model').CreateChildRequest =
      {
        ...this.childForm.value,
        parentId: currentUser.id,
      };

    this.userService.createChild(request).subscribe({
      next: () => {
        this.invitationLoading.set(false);
        this.childFormSuccess.set('Compte enfant créé avec succès');
        this.invitationEmail.set('');
        setTimeout(() => {
          if (this.invitationSuccess()) {
            this.closeInvitationModal();
          }
        }, 3000);
      },
      error: (error) => {
        this.childFormLoading.set(false);
        const errorMessage =
          error?.error?.message ||
          error?.message ||
          'Erreur lors de la création du compte';
        this.childFormError.set(errorMessage);
      },
    });
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

  sendChildInvitation(): void {
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

    const currentUser = this.currentUser();

    this.invitationService
      .sendInvitation({
        email,
        targetRole: 'ELEVE' as TypeUser,
        parentId: currentUser?.id,
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
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            "Erreur lors de l'envoi de l'invitation";
          this.invitationError.set(errorMessage);
        },
      });
  }
}
