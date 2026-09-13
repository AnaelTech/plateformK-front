import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { ProfileService } from '../../shared/services/profile.service';
import { EmailValidationService } from '../../shared/services/email-validation.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/User';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './components/profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly emailValidationService = inject(EmailValidationService);
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);

  // État
  profile = signal<User | null>(null);
  isLoading = signal(true);
  isUpdating = signal(false);
  isChangingPassword = signal(false);
  isSendingValidation = signal(false);
  isValidatingCode = signal(false);
  showPasswordSection = signal(false);
  showEmailValidation = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Formulaires
  profileForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    address: [''],
    city: [''],
    postalCode: [''],
    birthDate: [''],
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  validationCodeForm: FormGroup = this.fb.group({
    code: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    ],
  });

  // Computed
  emailChanged(): boolean {
    const profile = this.profile();
    const formEmail = this.profileForm.get('email')?.value;
    return !!(profile && formEmail && profile.email !== formEmail);
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.populateForm(profile);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Erreur lors du chargement du profil');
      },
    });
  }

  private populateForm(profile: User): void {
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      city: profile.city || '',
      postalCode: profile.postalCode || '',
      birthDate: profile.birthDate || '',
    });
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isUpdating.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.profileForm.value;
    const request = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber || undefined,
      address: formValue.address || undefined,
      city: formValue.city || undefined,
      postalCode: formValue.postalCode
        ? Number(formValue.postalCode)
        : undefined,
      birthDate: formValue.birthDate || undefined,
    };

    this.profileService.updateProfile(request).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isUpdating.set(false);
        this.successMessage.set('Profil mis à jour avec succès');
        this.notificationService.success('Profil mis à jour avec succès');
        // Rafraîchir l'utilisateur dans le service
        this.userService.refreshCurrentUser();
      },
      error: (err) => {
        this.isUpdating.set(false);
        this.errorMessage.set(
          err.error?.message || 'Erreur lors de la mise à jour du profil',
        );
      },
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.isChangingPassword.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.profileService
      .changePassword({ currentPassword, newPassword })
      .subscribe({
        next: () => {
          this.isChangingPassword.set(false);
          this.successMessage.set('Mot de passe modifié avec succès');
          this.notificationService.success('Mot de passe modifié avec succès');
          this.passwordForm.reset();
          this.showPasswordSection.set(false);
        },
      error: (err) => {
          this.isChangingPassword.set(false);
          this.errorMessage.set(
            err.error?.message || 'Erreur lors du changement de mot de passe',
          );
        },
      });
  }

  sendValidationCode(): void {
    this.isSendingValidation.set(true);
    this.errorMessage.set(null);

    this.emailValidationService.sendValidationCode().subscribe({
      next: () => {
        this.isSendingValidation.set(false);
        this.showEmailValidation.set(true);
        this.notificationService.success('Code de validation envoyé par email');
      },
      error: (err) => {
        this.isSendingValidation.set(false);
        this.errorMessage.set(
          err.error?.message || "Erreur lors de l'envoi du code",
        );
      },
    });
  }

  validateCode(): void {
    if (this.validationCodeForm.invalid) {
      this.validationCodeForm.markAllAsTouched();
      return;
    }

    const { code } = this.validationCodeForm.value;

    this.isValidatingCode.set(true);
    this.errorMessage.set(null);

    this.emailValidationService.validateCode(code).subscribe({
      next: () => {
        this.isValidatingCode.set(false);
        this.showEmailValidation.set(false);
        this.successMessage.set('Email validé avec succès');
        this.notificationService.success('Email validé avec succès');
        // Rafraîchir le profil
        this.loadProfile();
        this.userService.refreshCurrentUser();
      },
      error: (err) => {
        this.isValidatingCode.set(false);
        this.errorMessage.set(err.error?.message || 'Code invalide');
      },
    });
  }

  togglePasswordSection(): void {
    this.showPasswordSection.update((v) => !v);
    if (!this.showPasswordSection()) {
      this.passwordForm.reset();
    }
  }

  goBack(): void {
    const currentUser = this.userService.currentUser();
    if (currentUser) {
      switch (currentUser.typeUser) {
        case 'PROFESSEUR':
          this.router.navigate(['/dashboard']);
          break;
        case 'PARENT':
          this.router.navigate(['/parent-dashboard']);
          break;
        case 'ELEVE':
          this.router.navigate(['/student-dashboard']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Getters pour les erreurs de validation
  get firstNameError(): string | null {
    const control = this.profileForm.get('firstName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Le prénom est requis';
      if (control.errors['minlength']) return 'Minimum 2 caractères';
    }
    return null;
  }

  get lastNameError(): string | null {
    const control = this.profileForm.get('lastName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Le nom est requis';
      if (control.errors['minlength']) return 'Minimum 2 caractères';
    }
    return null;
  }

  get emailError(): string | null {
    const control = this.profileForm.get('email');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return "L'email est requis";
      if (control.errors['email']) return 'Email invalide';
    }
    return null;
  }

  get currentPasswordError(): string | null {
    const control = this.passwordForm.get('currentPassword');
    if (control?.errors && control.touched) {
      if (control.errors['required'])
        return 'Le mot de passe actuel est requis';
    }
    return null;
  }

  get newPasswordError(): string | null {
    const control = this.passwordForm.get('newPassword');
    if (control?.errors && control.touched) {
      if (control.errors['required'])
        return 'Le nouveau mot de passe est requis';
      if (control.errors['minlength']) return 'Minimum 8 caractères';
    }
    return null;
  }

  get confirmPasswordError(): string | null {
    const control = this.passwordForm.get('confirmPassword');
    if (control?.errors && control.touched) {
      if (control.errors['required'])
        return 'Veuillez confirmer le mot de passe';
    }
    return null;
  }
}
