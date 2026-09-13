import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Booking } from '../../models/Booking';

@Component({
  selector: 'app-booking-details-modal',
  standalone: true,
  imports: [],
  templateUrl: './booking-details-modal.html',
  styleUrl: './booking-details-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailsModal {
  booking = input.required<Booking>();
  closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  }
}
