import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';


@Component({
  selector: 'app-invitation-modal',
  standalone: true,
  imports: [],
  templateUrl: './invitation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationModalComponent {
  /** Titre affiché dans le header de la modale */
  title = input.required<string>();
  /** Texte descriptif sous le titre */
  description = input.required<string>();
  /** Label du champ email */
  emailLabel = input<string>('Adresse email');

  /** États internes (pilotés par le parent via le signal email) */
  email = signal('');
  loading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  /** Id unique pour aria-labelledby */
  readonly modalTitleId = `invitation-modal-title-${Math.random().toString(36).slice(2)}`;

  /** Émis quand l'utilisateur ferme la modale */
  closed = output<void>();
  /** Émis quand l'utilisateur clique sur "Envoyer" avec l'email saisi */
  send = output<string>();

  onClose(): void {
    this.closed.emit();
  }

  onSend(): void {
    this.send.emit(this.email().trim());
  }

  /** Méthodes utilitaires appelées par le parent pour piloter les états */
  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setSuccess(message: string | null): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
  }

  setError(message: string | null): void {
    this.errorMessage.set(message);
    this.successMessage.set(null);
  }

  reset(): void {
    this.email.set('');
    this.loading.set(false);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
