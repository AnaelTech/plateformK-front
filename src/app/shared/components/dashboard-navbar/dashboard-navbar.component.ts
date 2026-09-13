import {
  Component,
  inject,
  signal,
  computed,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';

import { User } from '../../models/User';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { getInitials } from '../../utils/string.utils';

export enum DashboardType {
  PARENT = 'PARENT',
  ELEVE = 'ELEVE',
  PROFESSEUR = 'PROFESSEUR',
}

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [NotificationBellComponent],
  templateUrl: './dashboard-navbar.component.html',
})
export class DashboardNavbarComponent {
  private readonly router = inject(Router);

  // Inputs
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly user = input.required<User | null>();
  readonly childrenCount = input<number>(0);
  readonly showNotifications = input<boolean>(true);
  readonly notificationCount = input<number>(0);

  // Outputs
  readonly settings = output<void>();
  readonly logout = output<void>();

  // State
  readonly showDropdown = signal<boolean>(false);

  // Computed
  readonly initials = computed(() => {
    const user = this.user();
    return user ? getInitials(`${user.firstName} ${user.lastName}`) : 'NA';
  });

  readonly fullName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  toggleDropdown(): void {
    this.showDropdown.update((v) => !v);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  onDropdownKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleDropdown();
    } else if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }

  onSettingsClick(): void {
    this.settings.emit();
    this.closeDropdown();
  }

  onLogoutClick(): void {
    this.logout.emit();
    this.closeDropdown();
  }

  onProfilClick(): void {
    this.router.navigate(['/profile']);
  }

  getDashboardSubtitle(): string {
    const user = this.user();
    if (!user) return this.subtitle();

    const userSubtitles: Record<string, string> = {
      PARENT: `${this.childrenCount()} enfant(s)`,
      ELEVE: 'Espace Élève',
      PROFESSEUR: 'Espace Professeur',
    };

    return userSubtitles[user.typeUser] || this.subtitle();
  }
}
