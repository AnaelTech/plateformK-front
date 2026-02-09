import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PasswordResetService } from '../../shared/services/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './components/forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly passwordResetService = inject(PasswordResetService);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = signal(false);
  isSuccess = signal(false);
  errorMessage = signal<string | null>(null);

  get emailError(): string | null {
    const control = this.forgotForm.get('email');
    if (control?.errors && (control.touched || control.dirty)) {
      if (control.errors['required']) return "L'adresse e-mail est requise";
      if (control.errors['email'])
        return 'Veuillez saisir une adresse e-mail valide';
    }
    return null;
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email } = this.forgotForm.value;

    this.passwordResetService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Pour des raisons de sécurité, on affiche toujours un succès
        // même si l'email n'existe pas
        this.isSuccess.set(true);
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
