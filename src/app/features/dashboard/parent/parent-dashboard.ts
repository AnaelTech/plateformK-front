import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { CoursService } from '../../../shared/services/cours.service';
import {
  InvoiceService,
  Invoice,
} from '../../../shared/services/invoice.service';
import { Cours, CoursStatus } from '../../../shared/models/Cours';
import { BookingStatus } from '../../../shared/models/Booking';
import { User } from '../../../shared/models/User';
import { DashboardNavbarComponent } from '../../../shared/components/dashboard-navbar/dashboard-navbar.component';
import { CalendarComponent } from '../../../shared/components/calendar/calendar.component';
import { AvailabilityService } from '../../../shared/services/availability.service';
import { AvailabilitySlot } from '../../../shared/models/Availability';
import { AuthService } from '../../../core/auth/services/auth.service';

export enum Tab {
  Overview = 'overview',
  Booking = 'booking',
  Children = 'children',
  Invoices = 'invoices',
  Payments = 'payments',
}

interface Child {
  id: number;
  name: string;
  level?: string;
  email?: string;
  parent?: string;
  nextSession?: Date;
  teacher?: string;
}

interface BookingDisplay {
  id: number;
  coursId: number;
  eleveId: number | undefined;
  child: string;
  date: Date;
  subject: string;
  teacher: string;
  price: number;
  duration: number;
  status: BookingStatus;
}

interface SlotDisplay {
  id: number;
  date: Date;
  duration: number;
  subject: string;
  price: number;
  teacher: string;
}

interface Payment {
  id: number;
  date: string;
  invoiceId: number;
  amount: number;
  method: string;
  status: string;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardNavbarComponent, CalendarComponent],
  templateUrl: './components/parent-dashboard.component.html',
})
export class ParentDashboardComponent {
  private readonly userService = inject(UserService);
  private readonly coursService = inject(CoursService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly authService = inject(AuthService);

  readonly Tab = Tab;

  readonly activeTab = signal<Tab>(Tab.Overview);

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

    return this.availabilities().filter(availability => availability.date === selectedDate);
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

    // Trouver la disponibilité correspondante
    const availability = this.availabilities().find(a => a.id === slotId);
    if (!availability) {
      alert('Créneau non trouvé');
      return;
    }

    // Créer une réservation basée sur la disponibilité
    const bookingRequest = {
      coursId: slotId, // Pour l'instant, on utilise slotId comme coursId temporairement
      eleveId: childId,
      notes: `Réservation pour ${availability.subject} avec ${availability.teacherName}`
    };

    // TODO: Une fois l'API de réservation implémentée côté backend,
    // remplacer par l'appel au service de réservation
    // this.bookingService.createBooking(bookingRequest).subscribe({...})

    // Pour l'instant, simuler une réservation réussie
    alert(`Réservation effectuée pour ${availability.subject} le ${this.formatDate(availability.date)} à ${availability.startTime} avec ${availability.teacherName}`);

    // Recharger les disponibilités pour refléter les changements
    this.loadAvailabilities();
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
          console.error('Erreur lors de la validation:', error);
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
          console.error('Erreur lors de la finalisation:', error);
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
            console.error("Erreur lors de l'annulation:", error);
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
        console.error('Failed to send invoice:', error);
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
        console.error('Failed to download invoice:', error);
      },
    });
  }

  payInvoice(invoiceId: number): void {
    alert('Redirection vers le paiement sécurisé Stripe...');
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      upcoming: 'À venir',
      completed: 'Terminé',
      cancelled: 'Annulé',
      paid: 'Payée',
      pending: 'En attente',
      overdue: 'En retard',
      failed: 'Échoué',
    };
    return labels[status] || status;
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
    this.coursService.getAllCours().subscribe((response) => {
      const currentParentId = this.currentUser()?.id;
      const childIds = this._children().map((c) => c.id);
      const bookingsMap = new Map<number, BookingDisplay>();
      const bookings = response.content
        .filter(
          (c) =>
            (c.statut !== CoursStatus.PENDING || c.eleveId) &&
            c.eleveId &&
            childIds.includes(c.eleveId) &&
            c.parentId === currentParentId,
        )
        .map((c) => this.coursToBookingDisplay(c));
      bookings.forEach((b) => bookingsMap.set(b.id, b));
      this._bookings.set(Array.from(bookingsMap.values()));

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
        student: 'Élève',
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
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    this.availabilityService.getAvailabilitiesByDateRange(startDate, endDate).subscribe({
      next: (availabilities) => {
        this.availabilities.set(availabilities);
      },
      error: (error) => {
        console.error('Failed to load availabilities:', error);
        this.availabilities.set([]);
      }
    });
  }

  onDateSelected(dateString: string): void {
    this.selectedDate.set(dateString);
  }
}
