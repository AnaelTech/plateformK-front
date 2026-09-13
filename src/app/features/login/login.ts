import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { TypeUser } from '../../shared/models/User';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './components/login.html', // ou './login.html'
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null); // Pour afficher un message d'erreur global

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
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        //console.log('Connexion réussie ! Token reçu.');

        const user = this.userService.currentUser();

        this.isLoading.set(false);

        let redirectPath = '/dashboard';

        if (user?.typeUser === TypeUser.PARENT) {
          redirectPath = '/parent-dashboard';
        } else if (user?.typeUser === TypeUser.ELEVE) {
          redirectPath = '/student-dashboard';
        }

        this.router.navigate([redirectPath]);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erreur de connexion', err);

        // Gestion des erreurs HTTP
        if (err.status === 401) {
          this.errorMessage.set('Identifiants incorrects. Veuillez réessayer.');
        } else if (err.status === 0 || !navigator.onLine) {
          this.errorMessage.set(
            'Impossible de contacter le serveur. Vérifiez votre connexion.',
          );
        } else {
          this.errorMessage.set(
            'Une erreur est survenue. Veuillez réessayer plus tard.',
          );
        }
      },
    });
  }
}
