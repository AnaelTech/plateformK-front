import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../shared/services/invitation.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { AuthResponse } from '../../core/auth/models/auth.model';
import { getDashboardRoute } from '../../core/routing/dashboard-routes';

@Component({
  selector: 'app-register-invitation',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register-invitation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterInvitation implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invitationService = inject(InvitationService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  token = signal<string>('');
  tokenData = signal<{email: string; targetRole: string} | null>(null);
  validating = signal(true);
  validationError = signal<string | null>(null);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: [''],
      address: [''],
      city: [''],
      postalCode: [''],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.token.set(token);
        this.validateToken(token);
      } else {
        this.validationError.set('Token d\'invitation manquant');
        this.validating.set(false);
      }
    });
  }

  private validateToken(token: string): void {
    this.invitationService.validateToken(token).subscribe({
      next: (response) => {
        if (response.valid) {
          this.tokenData.set(response);
          this.validating.set(false);
        } else {
          this.validationError.set('Token d\'invitation invalide');
          this.validating.set(false);
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message ||
          'Token d\'invitation invalide ou expiré';
        this.validationError.set(errorMessage);
        this.validating.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const request = {
      token: this.token(),
      ...this.registerForm.value,
    };

    this.invitationService.registerViaInvitation(request).subscribe({
      next: (response) => {
        // Utiliser AuthService pour sauvegarder les tokens correctement
        // (incluant token_expires_at et initialisation des signals UserService)
        this.authService.handlePostRegistration(response as unknown as AuthResponse);

        this.router.navigate([
          getDashboardRoute(response.user.typeUser, '/dashboard'),
        ]);
      },
      error: (error) => {
        this.submitting.set(false);
        const errorMessage =
          error?.error?.message ||
          'Erreur lors de la création du compte';
        this.submitError.set(errorMessage);
      },
    });
  }

  getRoleLabel(role: string | undefined): string {
    const labels: Record<string, string> = {
      PARENT: 'Parent',
      ELEVE: 'Élève',
      PROFESSEUR: 'Professeur',
    };
    return role ? labels[role] || role : '';
  }
}
