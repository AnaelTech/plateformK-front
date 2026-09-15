import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { NotificationService } from '../../shared/services/notification.service';

/**
 * Service de gestion des mises à jour de la PWA.
 *
 * Écoute les événements du Service Worker Angular et notifie l'utilisateur
 * lorsqu'une nouvelle version de l'application est prête à être installée.
 */
@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly notificationService = inject(NotificationService);

  /**
   * Initialise l'écoute des mises à jour du Service Worker.
   * À appeler une seule fois au démarrage de l'application.
   */
  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe({
      next: (event: VersionEvent) => this.handleVersionEvent(event),
    });
  }

  private handleVersionEvent(event: VersionEvent): void {
    switch (event.type) {
      case 'VERSION_READY':
        this.notificationService.prompt(
          'Une nouvelle version est disponible. Rechargez la page pour l\'appliquer.',
          {
            label: 'Recharger',
            handler: () => window.location.reload(),
          },
          'info',
          0
        );
        break;
      case 'VERSION_INSTALLATION_FAILED':
        this.notificationService.error(
          'La mise à jour de l\'application a échoué. Une nouvelle tentative aura lieu automatiquement.',
          0
        );
        break;
      case 'VERSION_DETECTED':
      default:
        // Événement silencieux : nouvelle version détectée, en cours d'installation.
        break;
    }
  }
}
