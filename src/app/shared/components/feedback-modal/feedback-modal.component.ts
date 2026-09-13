import { ChangeDetectionStrategy, Component, signal, output, effect } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface FeedbackModalData {
  notionsCovered?: string;
  teacherFeedback: string;
}

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackModalComponent {
  notionsCovered = signal('');
  teacherFeedback = signal('');
  errorMessage = signal('');

  feedbackSubmit = output<FeedbackModalData>();
  feedbackCancel = output<void>();

  isValid = signal(false);

  constructor() {
    effect(() => {
      this.isValid.set(this.teacherFeedback().trim().length > 0);
    });
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
