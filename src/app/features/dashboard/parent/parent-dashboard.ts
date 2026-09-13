import { logger } from '../../../shared/utils/logger';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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
} from '../../../shared/models/Cours';
import { Booking, BookingStatus } from '../../../shared/models/Booking';
import { User } from '../../../shared/models/User';
import { DashboardNavbar } from '../../../shared/components/dashboard-navbar/dashboard-navbar';
import { Calendar } from '../../../shared/components/calendar/calendar';
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
import { DashboardTabs } from '../../../shared/components/dashboard-tabs/dashboard-tabs';
import { BookingDetailsModal } from '../../../shared/components/booking-details-modal/booking-details-modal';
import { InvitationModal } from '../../../shared/components/invitation-modal/invitation-modal';
import { environment } from '../../../../environments/environment';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import {
  getStatusColor,
  getStatusLabel,
} from '../../../shared/utils/status.utils';
import { getStudentLevel } from '../../../shared/utils/student.utils';
import { getInitials } from '../../../shared/utils/string.utils';
import { WebSocketNotificationService } from '../../../shared/services/websocket-notification.service';
import { NotificationType } from '../../../shared/models/notification.model';

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
    FormsModule,
    ReactiveFormsModule,
    DashboardNavbar,
    Calendar,
    DashboardTabs,
    BookingDetailsModal,
    InvitationModal
],
  providers: [DateFormatPipe],
  templateUrl: './components/parent-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentDashboard implements OnInit {
  private readonly userService = inject(UserService);
  private readonly coursService = inject(CoursService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly invitationService = inject(InvitationService);
  private readonly fb = inject(FormBuilder);
  private readonly datePipe = inject(DateFormatPipe);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly websocketService = inject(WebSocketNotificationService);

  @ViewChild(InvitationModal)
  invitationModal?: InvitationModal;

  readonly Tab = Tab;

  readonly activeTab = signal<Tab>(Tab.Overview);

  // Invitation management
  showInvitationModal = signal(false);

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
      teacher?: string;
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
    // Mise à jour temps réel : sans recharger la page.
    // - Un nouveau créneau créé par un prof recharge les créneaux et
    //   sélectionne automatiquement la date du créneau signalé.
    // - Une facture émise / en retard / payée recharge les factures et les paiements.
    // - Une réservation confirmée, annulée ou terminée recharge les réservations.
    effect(() => {
      const notification = this.websocketService.latestNotification();
      if (!notification) return;

      if (notification.type === NotificationType.NEW_AVAILABILITY) {
        this.loadAvailabilities({
          selectCoursId: notification.relatedEntityId,
        });
      }

      if (
        notification.type === NotificationType.INVOICE_CREATED ||
        notification.type === NotificationType.INVOICE_DUE_SOON ||
        notification.type === NotificationType.INVOICE_OVERDUE ||
        notification.type === NotificationType.INVOICE_PAID
      ) {
        this.loadInvoicesData();
      }

      if (
        notification.type === NotificationType.BOOKING_CONFIRMED ||
        notification.type === NotificationType.BOOKING_CANCELLED ||
        notification.type === NotificationType.BOOKING_COMPLETED ||
        notification.type === NotificationType.COURS_REMINDER
      ) {
        this.loadCoursData();
      }
    });

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
    // Deep-linking depuis une notification (ex: /parent-dashboard?tab=booking&slot=12)
    this.route.queryParams.subscribe((params) => {
      const tabId = params['tab'];
      if (tabId) {
        const matched = Object.values(Tab).find((t) => t === tabId);
        if (matched) {
          this.activeTab.set(matched);
        }
      }

      const slotId = params['slot'] ? Number(params['slot']) : undefined;
      if (slotId) {
        this.loadAvailabilities({ selectCoursId: slotId });
      }
    });

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

    // Trouver le cours (créneau) correspondant
    const availability = this.availabilities().find((a) => a.id === slotId);
    if (!availability) {
      alert('Créneau non trouvé');
      return;
    }

    // Réserver directement le créneau (le cours existe déjà en base)
    const bookingRequest = {
      coursId: slotId,
      eleveId: childId,
      notes: `Réservation pour ${availability.subject}${
        availability.teacherName ? ` avec ${availability.teacherName}` : ''
      }`,
    };

    this.bookingService.createBooking(bookingRequest).subscribe({
      next: () => {
        alert(
          `Réservation effectuée pour ${availability.subject} le ${this.formatDate(availability.date)} à ${availability.startTime}${
            availability.teacherName ? ` avec ${availability.teacherName}` : ''
          }`,
        );
        // Recharger les disponibilités et les cours pour refléter les changements
        this.loadAvailabilities();
        this.loadCoursData();
      },
      error: (error) => {
        if (!environment.production) {
          logger.error('Erreur lors de la réservation:', error);
        }
        alert('Erreur lors de la création de la réservation');
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
          logger.error(
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
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: () => {
          this._bookings.update((bookings) =>
            bookings.map((booking) =>
              booking.id === bookingId
                ? { ...booking, status: BookingStatus.CANCELLED }
                : booking,
            ),
          );
        },
        error: (error) => {
          if (!environment.production) {
            logger.error(
              "Erreur lors de l'annulation de la réservation:",
              error,
            );
          }
        },
      });
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
            logger.error('Erreur lors de la validation:', error);
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
            logger.error('Erreur lors de la finalisation:', error);
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
              logger.error("Erreur lors de l'annulation:", error);
            }
          },
        });
    }
  }

  sendInvoice(invoiceId: number): void {
    this.invoiceService.sendInvoiceByEmail(invoiceId).subscribe({
      next: () => {
        logger.log('Invoice sent successfully');
        this.loadInvoicesData();
      },
      error: () => {
        /* empty */
      },
    });
  }

  downloadInvoice(invoiceId: number): void {
    this.invoiceService.downloadInvoicePdf(invoiceId);
  }

  payInvoice(invoiceId: number): void {
    // TODO: Intégrer ici la logique de paiement Stripe
    // Pour l'instant, on simule un paiement réussi
    if (confirm('Confirmer le paiement de cette facture ?')) {
      this.invoiceService.markInvoiceAsPaid(invoiceId).subscribe({
        next: () => {
          logger.log('Invoice marked as paid successfully');
          this.loadInvoicesData();
          // TODO: Afficher une notification de succès
        },
        error: (error) => {
          logger.error('Failed to mark invoice as paid:', error);
          // TODO: Afficher une notification d'erreur
        },
      });
    }
  }

  getStatusColor(status: string): string {
    return getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return getStatusLabel(status);
  }

  formatDate(date: Date | string | undefined): string {
    return this.datePipe.transform(date, 'date');
  }

  formatDateTime(date: Date | string | undefined): string {
    return this.datePipe.transform(date, 'datetime');
  }

  formatTime(date: Date | string | undefined): string {
    return this.datePipe.transform(date, 'time');
  }

  getInitials(name: string): string {
    return getInitials(name);
  }

  onNavbarSettings(): void {
    this.router.navigate(['/settings']);
  }

  onNavbarLogout(): void {
    this.authService.logout('/');
  }

  private loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        const childrenMap = new Map<number, Child>();
        user.enfants?.forEach((child: User) => {
          const c: Child = {
            id: child.id,
            name: `${child.firstName} ${child.lastName}`,
            level: this.getStudentLevel(child),
            email: child.email,
            parent: `${user.firstName} ${user.lastName}`,
            nextSession: undefined,
          };
          childrenMap.set(c.id, c);
        });
        this._children.set(Array.from(childrenMap.values()));
      },
      error: (error) => {
        if (!environment.production) {
          logger.error(
            'Erreur lors du chargement des données utilisateur:',
            error,
          );
        }
      },
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

        // Assigner le professeur à chaque enfant à partir de ses réservations
        const childrenWithTeacher = this._children().map((c) => {
          const booking = bookingDisplays.find(
            (b) => b.eleveId === c.id && b.teacher,
          );
          return booking
            ? { ...c, teacher: booking.teacher }
            : c;
        });
        this._children.set(childrenWithTeacher);
      },
      error: (error) => {
        logger.error('Failed to load bookings:', error);
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
        logger.error('Failed to load available slots:', error);
        this._availableSlots.set([]);
      },
    });
  }

  private loadInvoicesData(): void {
    this.invoiceService.getMyInvoices().subscribe((invoices) => {
      const clientInvoices = invoices.filter(
        (invoice) => invoice.invoiceType === 'CLIENT_INVOICE',
      );

      const formattedInvoices = clientInvoices.map((invoice) => ({
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
        teacher: invoice.teacherName,
      }));
      this._invoices.set(formattedInvoices);

      const payments: Payment[] = clientInvoices
        .filter((invoice) => invoice.isPaid && invoice.paidAt)
        .map((invoice) => ({
          id: invoice.id,
          date: invoice.paidAt as string,
          invoiceId: invoice.id,
          amount: invoice.totalAmount,
          method: 'Virement',
          status: 'success',
        }));
      this._payments.set(payments);
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

  private bookingToBookingDisplay(booking: Booking): BookingDisplay {
    const child = this._children().find((c) => c.id === booking.eleveId);
    return {
      id: booking.id,
      coursId: booking.coursId,
      eleveId: booking.eleveId,
      child: child ? child.name : 'Élève',
      date: new Date(booking.coursDate),
      subject: booking.coursMatiere,
      teacher: booking.teacherName || '',
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
      teacher: cours.teacherName || '',
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
    return getStudentLevel(eleve);
  }

  private loadAvailabilities(options?: { selectCoursId?: number }): void {
    // Charger les créneaux disponibles (cours sans réservation et futurs)
    this.coursService.getAvailableCours(0, 100, 'sessionDate', 'ASC').subscribe({
      next: (response) => {
        const coursList = response.data;
        this.userService
          .getUserNamesByIds(coursList.map((cours) => cours.teacherId))
          .subscribe((teacherNames) => {
            const slots = coursList.map((cours) =>
              this.coursToAvailabilitySlot(
                cours,
                teacherNames.get(cours.teacherId) ?? '',
              ),
            );
            this.availabilities.set(slots);

            // Sélectionner automatiquement la date du créneau signalé par la notification
            if (options?.selectCoursId) {
              const slot = slots.find((s) => s.id === options.selectCoursId);
              if (slot) {
                this.selectedDate.set(slot.date);
                this.selectedSlotId.set(slot.id);
              }
            }
          });
      },
      error: () => {
        this.availabilities.set([]);
      },
    });
  }

  private coursToAvailabilitySlot(
    cours: CoursSession,
    teacherName = '',
  ): AvailabilitySlot {
    const sessionDate = new Date(cours.sessionDate);
    const endTime = new Date(
      sessionDate.getTime() + cours.dureeMinutes * 60 * 1000,
    );
    return {
      id: cours.id,
      teacherId: cours.teacherId,
      teacherName,
      date: cours.sessionDate.split('T')[0],
      startTime: cours.sessionDate.split('T')[1]?.substring(0, 5) ?? '00:00',
      endTime: `${String(endTime.getHours()).padStart(2, '0')}:${String(
        endTime.getMinutes(),
      ).padStart(2, '0')}`,
      duration: cours.dureeMinutes / 60,
      subject: cours.matiere,
      price: cours.tarif,
    };
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
        this.childFormLoading.set(false);
        this.childFormSuccess.set('Compte enfant créé avec succès');
        this.invitationModal?.reset();
        setTimeout(() => {
          if (this.childFormSuccess()) {
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
    this.invitationModal?.reset();
    this.showInvitationModal.set(true);
  }

  closeInvitationModal(): void {
    this.showInvitationModal.set(false);
    this.invitationModal?.reset();
  }

  sendChildInvitation(email: string): void {
    if (!email) {
      this.invitationModal?.setError('Veuillez saisir une adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.invitationModal?.setError('Adresse email invalide');
      return;
    }

    this.invitationModal?.setLoading(true);
    const currentUser = this.currentUser();

    this.invitationService
      .sendInvitation({
        email,
        targetRole: 'ELEVE' as TypeUser,
        parentId: currentUser?.id,
      })
      .subscribe({
        next: () => {
          this.invitationModal?.setLoading(false);
          this.invitationModal?.setSuccess(
            `Invitation envoyée avec succès à ${email}`,
          );
          setTimeout(() => {
            if (this.invitationModal?.successMessage()) {
              this.closeInvitationModal();
            }
          }, 3000);
        },
        error: (error) => {
          this.invitationModal?.setLoading(false);
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            "Erreur lors de l'envoi de l'invitation";
          this.invitationModal?.setError(errorMessage);
        },
      });
  }
}
