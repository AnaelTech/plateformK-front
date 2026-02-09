import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { PasswordResetService } from '../../shared/services/password-reset.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './components/reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly passwordResetService = inject(PasswordResetService);

  resetForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  token = signal<string | null>(null);
  isLoading = signal(false);
  isSuccess = signal(false);
  isValidatingToken = signal(true);
  isTokenValid = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (!tokenParam) {
      this.isValidatingToken.set(false);
      this.errorMessage.set('Token de réinitialisation manquant');
      return;
    }

    this.token.set(tokenParam);
    this.validateToken(tokenParam);
  }

  private validateToken(token: string): void {
    this.passwordResetService.validateToken(token).subscribe({
      next: (response) => {
        this.isValidatingToken.set(false);
        this.isTokenValid.set(response.valid);
        if (!response.valid) {
          this.errorMessage.set('Ce lien a expiré ou est invalide');
        }
      },
      error: () => {
        this.isValidatingToken.set(false);
        this.isTokenValid.set(false);
        this.errorMessage.set('Ce lien a expiré ou est invalide');
      },
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  get passwordError(): string | null {
    const control = this.resetForm.get('password');
    if (control?.errors && (control.touched || control.dirty)) {
      if (control.errors['required']) return 'Le mot de passe est requis';
      if (control.errors['minlength'])
        return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    return null;
  }

  get confirmPasswordError(): string | null {
    const control = this.resetForm.get('confirmPassword');
    if (control?.errors && (control.touched || control.dirty)) {
      if (control.errors['required'])
        return 'Veuillez confirmer le mot de passe';
      if (control.errors['passwordMismatch'])
        return 'Les mots de passe ne correspondent pas';
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { password } = this.resetForm.value;

    this.passwordResetService
      .confirmPasswordReset(this.token()!, password)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSuccess.set(true);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message ||
              'Erreur lors de la réinitialisation du mot de passe'
          );
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
