import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FeedbackModalData {
  notionsCovered?: string;
  teacherFeedback: string;
}

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Terminer le cours</h2>
          <button class="close-btn" (click)="onCancel()" aria-label="Fermer">
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="notionsCovered">
              Notions abordées
              <span class="optional">(optionnel)</span>
            </label>
            <textarea
              id="notionsCovered"
              [(ngModel)]="notionsCoveredValue"
              (ngModelChange)="notionsCovered.set($event)"
              placeholder="Ex: Théorème de Pythagore, équations du second degré..."
              rows="3"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ notionsCovered().length }}/500</div>
          </div>

          <div class="form-group">
            <label for="teacherFeedback">
              Appréciation / Commentaire
              <span class="required">*</span>
            </label>
            <textarea
              id="teacherFeedback"
              [(ngModel)]="teacherFeedbackValue"
              (ngModelChange)="teacherFeedback.set($event)"
              placeholder="Votre appréciation sur la séance, le comportement de l'élève, les progrès réalisés..."
              rows="5"
              maxlength="1000"
              required
            ></textarea>
            <div class="char-count">{{ teacherFeedback().length }}/1000</div>
          </div>

          @if (errorMessage()) {
            <div class="error-message">{{ errorMessage() }}</div>
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onCancel()">
            Annuler
          </button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="!isValid()"
          >
            Valider et terminer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      line-height: 1;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
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

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #374151;
      font-size: 0.95rem;
    }

    .optional {
      font-weight: 400;
      color: #9ca3af;
      font-size: 0.85rem;
    }

    .required {
      color: #ef4444;
    }

    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1.5px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: inherit;
      resize: vertical;
      transition: all 0.2s;
    }

    textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea::placeholder {
      color: #9ca3af;
    }

    .char-count {
      text-align: right;
      font-size: 0.8rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      opacity: 0.6;
    }
  `],
})
export class FeedbackModalComponent {
  notionsCoveredValue = '';
  teacherFeedbackValue = '';
  
  notionsCovered = signal('');
  teacherFeedback = signal('');
  errorMessage = signal('');

  submit = output<FeedbackModalData>();
  cancel = output<void>();

  isValid = signal(false);

  constructor() {
    setInterval(() => {
      this.isValid.set(this.teacherFeedback().trim().length > 0);
    }, 100);
  }

  onSubmit(): void {
    const feedback = this.teacherFeedback().trim();

    if (!feedback) {
      this.errorMessage.set("L'appréciation est obligatoire");
      return;
    }

    if (feedback.length > 1000) {
      this.errorMessage.set("L'appréciation ne doit pas dépasser 1000 caractères");
      return;
    }

    this.submit.emit({
      notionsCovered: this.notionsCovered().trim() || undefined,
      teacherFeedback: feedback,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
