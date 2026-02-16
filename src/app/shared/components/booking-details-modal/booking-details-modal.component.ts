import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking } from '../../models/Booking';

@Component({
  selector: 'app-booking-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="modal-overlay"
      (click)="onClose()"
      tabindex="0"
      (keyup.enter)="onClose()"
      (keyup.space)="onClose()"
    >
      <div
        class="modal-content"
        (click)="$event.stopPropagation()"
        tabindex="0"
        (keyup.enter)="$event.stopPropagation()"
        (keyup.space)="$event.stopPropagation()"
      >
        <div class="modal-header">
          <h2>Détails du cours</h2>
          <button class="close-btn" (click)="onClose()" aria-label="Fermer">
            ×
          </button>
        </div>

        <div class="modal-body">
          @if (booking()) {
            <!-- Course Information -->
            <div class="section">
              <h3 class="section-title">📚 Informations du cours</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Matière</span>
                  <span class="value">{{ booking()!.coursMatiere }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Titre</span>
                  <span class="value">{{ booking()!.coursTitre }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Date</span>
                  <span class="value">{{
                    formatDate(booking()!.coursDate)
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Durée</span>
                  <span class="value"
                    >{{ booking()!.coursDureeMinutes }} min</span
                  >
                </div>
                <div class="info-item">
                  <span class="label">Tarif</span>
                  <span class="value">{{ booking()!.coursTarif }}€</span>
                </div>
                <div class="info-item">
                  <span class="label">Statut</span>
                  <span
                    class="status-badge"
                    [class]="'status-' + booking()!.status.toLowerCase()"
                  >
                    {{ getStatusLabel(booking()!.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Participants -->
            <div class="section">
              <h3 class="section-title">👥 Participants</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Élève</span>
                  <span class="value">{{ booking()!.eleveName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Parent</span>
                  <span class="value">{{ booking()!.parentName }}</span>
                </div>
              </div>
            </div>

            <!-- Notes from parent -->
            @if (booking()!.notes) {
              <div class="section">
                <h3 class="section-title">📝 Notes du parent</h3>
                <div class="notes-box">
                  {{ booking()!.notes }}
                </div>
              </div>
            }

            <!-- Teacher feedback (only if completed) -->
            @if (booking()!.status === 'COMPLETED') {
              @if (booking()!.notionsCovered || booking()!.teacherFeedback) {
                <div class="section feedback-section">
                  <h3 class="section-title">✅ Bilan du professeur</h3>

                  @if (booking()!.notionsCovered) {
                    <div class="feedback-item">
                      <h4 class="feedback-label">Notions abordées</h4>
                      <div class="feedback-box notions">
                        {{ booking()!.notionsCovered }}
                      </div>
                    </div>
                  }

                  @if (booking()!.teacherFeedback) {
                    <div class="feedback-item">
                      <h4 class="feedback-label">Appréciation</h4>
                      <div class="feedback-box appreciation">
                        {{ booking()!.teacherFeedback }}
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="section">
                  <div class="empty-feedback">
                    <span class="empty-icon">ℹ️</span>
                    <p>
                      Le professeur n'a pas encore ajouté de commentaire pour ce
                      cours.
                    </p>
                  </div>
                </div>
              }
            }
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" (click)="onClose()">Fermer</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .modal-header {
        padding: 1.75rem;
        border-bottom: 2px solid #f3f4f6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #111827;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 2rem;
        line-height: 1;
        cursor: pointer;
        color: #9ca3af;
        padding: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: #f3f4f6;
        color: #1f2937;
      }

      .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
      }

      .section {
        margin-bottom: 1.75rem;
      }

      .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .value {
        font-size: 0.9375rem;
        font-weight: 500;
        color: #111827;
      }

      .status-badge {
        display: inline-block;
        padding: 0.375rem 0.875rem;
        border-radius: 9999px;
        font-size: 0.8125rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .status-pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-confirmed {
        background: #dbeafe;
        color: #1e40af;
      }

      .status-completed {
        background: #d1fae5;
        color: #065f46;
      }

      .status-cancelled {
        background: #fee2e2;
        color: #991b1b;
      }

      .notes-box {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        font-size: 0.9375rem;
        color: #374151;
        line-height: 1.6;
      }

      .feedback-section {
        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        border: 2px solid #86efac;
        border-radius: 12px;
        padding: 1.5rem;
      }

      .feedback-item {
        margin-bottom: 1.25rem;
      }

      .feedback-item:last-child {
        margin-bottom: 0;
      }

      .feedback-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #065f46;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        margin: 0 0 0.625rem 0;
      }

      .feedback-box {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        font-size: 0.9375rem;
        line-height: 1.6;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .feedback-box.notions {
        border-left: 3px solid #3b82f6;
        color: #1e40af;
      }

      .feedback-box.appreciation {
        border-left: 3px solid #10b981;
        color: #065f46;
      }

      .empty-feedback {
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        color: #6b7280;
      }

      .empty-icon {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 0.75rem;
      }

      .empty-feedback p {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.5;
      }

      .modal-footer {
        padding: 1.5rem;
        border-top: 2px solid #f3f4f6;
        display: flex;
        justify-content: flex-end;
      }

      .btn {
        padding: 0.75rem 1.75rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9375rem;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
    `,
  ],
})
export class BookingDetailsModalComponent {
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
