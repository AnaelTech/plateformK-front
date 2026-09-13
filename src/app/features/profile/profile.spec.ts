import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Profile } from './profile';
import { ProfileService } from '../../shared/services/profile.service';
import { EmailValidationService } from '../../shared/services/email-validation.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UserService } from '../../shared/services/user.service';
import { TypeUser, User } from '../../shared/models/User';

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
  let component: Profile;

  const mockUser = {
    id: 1,
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Roe',
    typeUser: TypeUser.PARENT,
    emailValid: true,
  } as User;

  const currentUser = signal<User | null>(null);

  const profileServiceMock = {
    getProfile: jasmine.createSpy('getProfile').and.returnValue(of(mockUser)),
    updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of(mockUser)),
    changePassword: jasmine
      .createSpy('changePassword')
      .and.returnValue(of(void 0)),
  };
  const emailValidationServiceMock = {
    sendValidationCode: jasmine
      .createSpy('sendValidationCode')
      .and.returnValue(of(void 0)),
    validateCode: jasmine.createSpy('validateCode').and.returnValue(of(void 0)),
  };
  const notificationServiceMock = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
  };
  const userServiceMock = {
    currentUser,
    refreshCurrentUser: jasmine.createSpy('refreshCurrentUser'),
  };
  const routerMock = { navigate: jasmine.createSpy('navigate') };

  beforeEach(async () => {
    currentUser.set({ ...mockUser, typeUser: TypeUser.PARENT });
    for (const spy of [
      profileServiceMock.getProfile,
      profileServiceMock.updateProfile,
      profileServiceMock.changePassword,
      emailValidationServiceMock.sendValidationCode,
      emailValidationServiceMock.validateCode,
      notificationServiceMock.success,
      notificationServiceMock.error,
      userServiceMock.refreshCurrentUser,
      routerMock.navigate,
    ]) {
      spy.calls.reset();
    }
    profileServiceMock.getProfile.and.returnValue(of(mockUser));
    await TestBed.configureTestingModule({
      providers: [
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: EmailValidationService, useValue: emailValidationServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and populate the profile on init', () => {
    expect(component.profile()).toEqual(mockUser);
    expect(component.profileForm.get('firstName')?.value).toBe('Jane');
    expect(component.isLoading()).toBe(false);
  });

  it('should surface an error when loading fails', () => {
    profileServiceMock.getProfile.and.returnValue(
      throwError(() => new Error('boom')),
    );

    component.loadProfile();

    expect(component.errorMessage()).toBe('Erreur lors du chargement du profil');
    expect(component.isLoading()).toBe(false);
  });

  it('should not submit an invalid profile form', () => {
    component.profileForm.get('firstName')?.setValue('');

    component.onUpdateProfile();

    expect(profileServiceMock.updateProfile).not.toHaveBeenCalled();
    expect(component.profileForm.get('firstName')?.touched).toBe(true);
  });

  it('should update the profile and notify on success', () => {
    component.onUpdateProfile();

    expect(profileServiceMock.updateProfile).toHaveBeenCalled();
    expect(component.successMessage()).toBe('Profil mis à jour avec succès');
    expect(notificationServiceMock.success).toHaveBeenCalled();
    expect(userServiceMock.refreshCurrentUser).toHaveBeenCalled();
  });

  it('should reject mismatched passwords', () => {
    component.passwordForm.setValue({
      currentPassword: 'oldpass',
      newPassword: 'newpassword1',
      confirmPassword: 'different',
    });

    component.onChangePassword();

    expect(component.errorMessage()).toBe(
      'Les mots de passe ne correspondent pas',
    );
    expect(profileServiceMock.changePassword).not.toHaveBeenCalled();
  });

  it('should change the password and reset the form on success', () => {
    component.showPasswordSection.set(true);
    component.passwordForm.setValue({
      currentPassword: 'oldpass',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
    });

    component.onChangePassword();

    expect(profileServiceMock.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass',
      newPassword: 'newpassword1',
    });
    expect(component.successMessage()).toBe('Mot de passe modifié avec succès');
    expect(component.showPasswordSection()).toBe(false);
  });

  it('should show the email validation form after sending a code', () => {
    component.sendValidationCode();

    expect(emailValidationServiceMock.sendValidationCode).toHaveBeenCalled();
    expect(component.showEmailValidation()).toBe(true);
  });

  it('should not validate an invalid code', () => {
    component.validateCode();

    expect(emailValidationServiceMock.validateCode).not.toHaveBeenCalled();
  });

  it('should toggle the password section and reset it when hidden', () => {
    component.showPasswordSection.set(true);
    component.passwordForm.get('currentPassword')?.setValue('something');

    component.togglePasswordSection();

    expect(component.showPasswordSection()).toBe(false);
    expect(component.passwordForm.get('currentPassword')?.value).toBeNull();
  });

  it('should detect an email change', () => {
    expect(component.emailChanged()).toBe(false);

    component.profileForm.get('email')?.setValue('new@example.com');

    expect(component.emailChanged()).toBe(true);
  });

  it('should go back to the parent dashboard', () => {
    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/parent-dashboard']);
  });
});
