import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../shared/services/invitation.service';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-register-invitation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register-invitation.component.html',
})
export class RegisterInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invitationService = inject(InvitationService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  token = signal<string>('');
  tokenData = signal<any>(null);
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
        // Store tokens manually (since saveTokens is private)
        localStorage.setItem('auth_token', response.accessToken);
        localStorage.setItem('refresh_token', response.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(response.user));

        const role = response.user.typeUser;
        if (role === 'PARENT') {
          this.router.navigate(['/parent-dashboard']);
        } else if (role === 'ELEVE') {
          this.router.navigate(['/student-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
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
    const labels: { [key: string]: string } = {
      PARENT: 'Parent',
      ELEVE: 'Élève',
      PROFESSEUR: 'Professeur',
    };
    return role ? labels[role] || role : '';
  }
}
