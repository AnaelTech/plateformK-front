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
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.css'],
})
export class FeedbackModalComponent {
  notionsCoveredValue = '';
  teacherFeedbackValue = '';

  notionsCovered = signal('');
  teacherFeedback = signal('');
  errorMessage = signal('');

  feedbackSubmit = output<FeedbackModalData>();
  feedbackCancel = output<void>();

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
      this.errorMessage.set(
        "L'appréciation ne doit pas dépasser 1000 caractères",
      );
      return;
    }

    this.feedbackSubmit.emit({
      notionsCovered: this.notionsCovered().trim() || undefined,
      teacherFeedback: feedback,
    });
  }

  onCancel(): void {
    this.feedbackCancel.emit();
  }
}
