import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { CoursService } from '../../../shared/services/cours.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import {
  Cours,
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
    DashboardNavbarComponent,
    CalendarComponent,
    DashboardTabsComponent,
  ],
  templateUrl: './components/parent-dashboard.component.html',
})
export class ParentDashboardComponent {
  private readonly userService = inject(UserService);
  private readonly coursService = inject(CoursService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);

  readonly Tab = Tab;

  readonly activeTab = signal<Tab>(Tab.Overview);

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
    }[]
  >([]);
  private readonly _payments = signal<Payment[]>([]);

  readonly selectedChildId = signal<number | null>(null);
  readonly selectedSlotId = signal<number | null>(null);
  readonly selectedDate = signal<string | null>(null);
  readonly availabilities = signal<AvailabilitySlot[]>([]);

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
    this._invoices().filter((i) => i.status === 'pending'),
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
    effect(() => {
      this.loadUserData();
      this.loadCoursData();
      this.loadInvoicesData();
      this.loadAvailabilities();
    });
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

    // Créer un cours basé sur la disponibilité
    const courseRequest: CreateCoursRequest = {
      titre: `Cours de ${availability.subject}`,
      matiere: availability.subject,
      dureeMinutes: availability.duration * 60,
      dateCours: `${availability.date}T${availability.startTime}`,
      notionsAbordees: `Cours particulier de ${availability.subject}`,
      tarif: availability.price,
      parentId: currentUser.id,
      eleveId: childId,
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
                  //console.error('Erreur lors de la mise à jour de la disponibilité:', error);
                  alert(
                    'Réservation créée mais erreur lors de la mise à jour de la disponibilité',
                  );
                  // Recharger quand même les cours en cas d'erreur
                  this.loadCoursData();
                },
              });
          },
          error: (error) => {
            //console.error('Erreur lors de la réservation:', error);
            alert('Erreur lors de la création de la réservation');
          },
        });
      },
      error: (error) => {
        //console.error('Erreur lors de la création du cours:', error);
        alert('Erreur lors de la création du cours');
      },
    });
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
          //console.error('Erreur lors de la validation:', error);
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
          //console.error('Erreur lors de la finalisation:', error);
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
            //console.error("Erreur lors de l'annulation:", error);
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
      error: (error) => {
        //console.error('Failed to send invoice:', error);
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
      error: (error) => {
        //console.error('Failed to download invoice:', error);
      },
    });
  }

  payInvoice(invoiceId: number): void {
    alert('Redirection vers le paiement sécurisé Stripe...');
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
          nextSession: this.getNextSession(child),
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

    // Charger les cours pour les slots disponibles (cours sans élève assigné)
    this.coursService.getAllCours().subscribe((response) => {
      const slotsMap = new Map<number, SlotDisplay>();
      const slots = response.content
        .filter(
          (c) =>
            c.statut === CoursStatus.PENDING &&
            !c.eleveId &&
            c.parentId === currentParentId,
        )
        .map((c) => this.coursToSlotDisplay(c));
      slots.forEach((s) => slotsMap.set(s.id, s));
      this._availableSlots.set(Array.from(slotsMap.values()));
    });
  }

  private loadInvoicesData(): void {
    this.invoiceService.getMyInvoices().subscribe((invoices) => {
      const formattedInvoices = invoices.map((invoice) => ({
        id: invoice.id,
        student: invoice.studentName || 'Élève',
        date: invoice.creationDate,
        dueDate: invoice.dueDate,
        amount: invoice.totalAmount,
        status: this.mapInvoiceStatus(invoice.statut),
      }));
      this._invoices.set(formattedInvoices);
    });
  }

  private mapInvoiceStatus(
    status: string,
  ): 'paid' | 'pending' | 'overdue' | 'failed' {
    const statusMap: Record<string, 'paid' | 'pending' | 'overdue' | 'failed'> =
      {
        PAID: 'paid',
        SENT: 'pending',
        OVERDUE: 'overdue',
        DRAFT: 'pending',
      };
    return statusMap[status] || 'pending';
  }

  private coursToBookingDisplay(cours: Cours): BookingDisplay {
    const child = this._children().find((c) => c.id === cours.eleveId);
    return {
      id: cours.id,
      coursId: cours.id,
      eleveId: cours.eleveId,
      child: child ? child.name : 'Élève',
      date: new Date(cours.dateCours),
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

  private coursToSlotDisplay(cours: Cours): SlotDisplay {
    return {
      id: cours.id,
      date: new Date(cours.dateCours),
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

  private getStudentLevel(eleve: any): string {
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

  private getNextSession(eleve: any): Date | undefined {
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
        error: (error) => {
          //console.error('Failed to load availabilities:', error);
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
}
