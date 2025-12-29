// parent-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Child {
  id: number;
  name: string;
  level: string;
  teacher: string;
}

interface AvailableSlot {
  id: number;
  date: Date;
  duration: number;
  subject: string;
  price: number;
  teacher: string;
}

interface Booking {
  id: number;
  child: string;
  date: Date;
  duration: number;
  subject: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  teacher: string;
}

interface Invoice {
  id: number;
  child: string;
  amount: number;
  date: Date;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: Date;
  downloadUrl?: string;
}

interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  date: Date;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

export enum Tab {
  Overview = 'overview',
  Booking = 'booking',
  Children = 'children',
  Invoices = 'invoices',
  Payments = 'payments',
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './components/parent-dashboard.component.html',
})
export class ParentDashboardComponent implements OnInit {
  activeTab: Tab = Tab.Overview;
  Tab = Tab;

  // Enfants
  children: Child[] = [
    {
      id: 1,
      name: 'Marie Dupont',
      level: 'Terminale S',
      teacher: 'Prof. Dubois',
    },
    { id: 2, name: 'Lucas Dupont', level: '1ère ES', teacher: 'Prof. Martin' },
  ];

  // Créneaux disponibles
  availableSlots: AvailableSlot[] = [
    {
      id: 1,
      date: new Date('2025-01-20T14:00'),
      duration: 2,
      subject: 'Mathématiques',
      price: 60,
      teacher: 'Prof. Dubois',
    },
    {
      id: 2,
      date: new Date('2025-01-21T16:00'),
      duration: 1.5,
      subject: 'Physique',
      price: 45,
      teacher: 'Prof. Martin',
    },
    {
      id: 3,
      date: new Date('2025-01-22T10:00'),
      duration: 2,
      subject: 'Mathématiques',
      price: 60,
      teacher: 'Prof. Dubois',
    },
    {
      id: 4,
      date: new Date('2025-01-23T14:00'),
      duration: 1,
      subject: 'Chimie',
      price: 30,
      teacher: 'Prof. Bernard',
    },
  ];

  // Réservations
  bookings: Booking[] = [
    {
      id: 1,
      child: 'Marie Dupont',
      date: new Date('2025-01-15T14:00'),
      duration: 2,
      subject: 'Mathématiques',
      status: 'upcoming',
      price: 60,
      teacher: 'Prof. Dubois',
    },
    {
      id: 2,
      child: 'Lucas Dupont',
      date: new Date('2025-01-16T16:00'),
      duration: 1.5,
      subject: 'Physique',
      status: 'upcoming',
      price: 45,
      teacher: 'Prof. Martin',
    },
    {
      id: 3,
      child: 'Marie Dupont',
      date: new Date('2024-12-20T14:00'),
      duration: 2,
      subject: 'Mathématiques',
      status: 'completed',
      price: 60,
      teacher: 'Prof. Dubois',
    },
  ];

  // Factures
  invoices: Invoice[] = [
    {
      id: 1,
      child: 'Marie Dupont',
      amount: 240,
      date: new Date('2024-12-01'),
      status: 'paid',
      dueDate: new Date('2024-12-15'),
    },
    {
      id: 2,
      child: 'Lucas Dupont',
      amount: 180,
      date: new Date('2024-12-05'),
      status: 'pending',
      dueDate: new Date('2024-12-20'),
    },
    {
      id: 3,
      child: 'Marie Dupont',
      amount: 120,
      date: new Date('2024-12-10'),
      status: 'overdue',
      dueDate: new Date('2024-12-25'),
    },
  ];

  // Paiements
  payments: Payment[] = [
    {
      id: 1,
      invoiceId: 1,
      amount: 240,
      date: new Date('2024-12-10'),
      method: 'Carte bancaire',
      status: 'completed',
    },
    {
      id: 2,
      invoiceId: 2,
      amount: 180,
      date: new Date('2024-12-15'),
      method: 'Stripe',
      status: 'pending',
    },
  ];

  // Statistiques
  stats = {
    upcomingBookings: 0,
    totalSpent: 0,
    pendingInvoices: 0,
    completedSessions: 0,
  };

  // Réservations à venir
  upcomingBookings: Booking[] = [];

  // Factures en attente
  pendingInvoices: Invoice[] = [];

  // Sélection pour réservation
  selectedChild: number | null = null;
  selectedSlot: number | null = null;

  ngOnInit(): void {
    this.calculateStats();
    this.upcomingBookings = this.bookings
      .filter((b) => b.status === 'upcoming')
      .slice(0, 3);
    this.pendingInvoices = this.invoices.filter(
      (inv) => inv.status === 'pending' || inv.status === 'overdue'
    );
  }

  calculateStats(): void {
    this.stats.upcomingBookings = this.bookings.filter(
      (b) => b.status === 'upcoming'
    ).length;
    this.stats.totalSpent = this.payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    this.stats.pendingInvoices = this.invoices.filter(
      (inv) => inv.status === 'pending' || inv.status === 'overdue'
    ).length;
    this.stats.completedSessions = this.bookings.filter(
      (b) => b.status === 'completed'
    ).length;
  }

  setActiveTab(tab: Tab): void {
    this.activeTab = tab;
  }

  isActiveTab(tab: Tab): boolean {
    return this.activeTab === tab;
  }

  bookSlot(slotId: number): void {
    if (!this.selectedChild) {
      alert('Veuillez sélectionner un enfant');
      return;
    }
    // TODO: Appel API pour réserver le créneau
    console.log(
      'Réservation du créneau:',
      slotId,
      "pour l'enfant:",
      this.selectedChild
    );
    alert('Réservation effectuée ! Redirection vers le paiement...');
  }

  cancelBooking(bookingId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      const booking = this.bookings.find((b) => b.id === bookingId);
      if (booking) {
        booking.status = 'cancelled';
        // TODO: Appel API pour annuler la réservation
      }
    }
  }

  payInvoice(invoiceId: number): void {
    // TODO: Redirection vers Stripe pour le paiement
    console.log('Paiement de la facture:', invoiceId);
    alert('Redirection vers le paiement sécurisé Stripe...');
  }

  downloadInvoice(invoiceId: number): void {
    // TODO: Appel API pour télécharger la facture PDF
    console.log('Téléchargement de la facture:', invoiceId);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
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
    const labels: { [key: string]: string } = {
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

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }
}
