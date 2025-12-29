import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

// Import de ton AuthService
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './components/login.component.html', // ou './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService); // Injection du service d'auth

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  showPassword = false;
  isLoading = false;
  errorMessage: string | null = null; // Pour afficher un message d'erreur global

  get emailError(): string | null {
    const control = this.loginForm.get('email');
    if (control?.errors && (control.touched || control.dirty)) {
      if (control.errors['required']) return "L'adresse e-mail est requise";
      if (control.errors['email'])
        return 'Veuillez saisir une adresse e-mail valide';
    }
    return null;
  }

  get passwordError(): string | null {
    const control = this.loginForm.get('password');
    if (control?.errors && (control.touched || control.dirty)) {
      if (control.errors['required']) return 'Le mot de passe est requis';
      if (control.errors['minlength'])
        return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        // Token sauvegardé automatiquement dans le AuthService (via tap dans login())
        console.log('Connexion réussie ! Token reçu.');

        // Optionnel : si tu veux persister "remember me" (ex: expiration token plus longue côté backend)
        // Tu peux stocker une préférence ici si besoin

        this.isLoading = false;

        // Redirection intelligente selon le rôle (si tu as un endpoint /me qui retourne le rôle)
        // Pour l'instant, on redirige vers un dashboard générique
        this.router.navigate(['/dashboard']);

        // Exemple futur si tu veux différencier :
        // this.router.navigate(['/parent-dashboard']);
        // this.router.navigate(['/student-dashboard']);
        // this.router.navigate(['/teacher-dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur de connexion', err);

        // Gestion des erreurs HTTP
        if (err.status === 401) {
          this.errorMessage = 'Identifiants incorrects. Veuillez réessayer.';
        } else if (err.status === 0 || !navigator.onLine) {
          this.errorMessage =
            'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
          this.errorMessage =
            'Une erreur est survenue. Veuillez réessayer plus tard.';
        }
      },
    });
  }
}
