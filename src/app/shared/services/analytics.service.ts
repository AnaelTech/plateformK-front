import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnhancedBookingStats } from '../models/analytics.model';

/**
 * Service pour les statistiques et analytics.
 * Expose les endpoints GET /api/v1/analytics/stats et GET /api/v1/analytics/global.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}analytics`;

  private readonly http = inject(HttpClient);

  /**
   * Récupère les statistiques avancées pour l'utilisateur connecté.
   * Accessible à tous les utilisateurs authentifiés.
   */
  getStats(): Observable<EnhancedBookingStats> {
    return this.http.get<EnhancedBookingStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Récupère les statistiques globales de la plateforme.
   * Réservé aux administrateurs (ADMIN).
   */
  getGlobalStats(): Observable<EnhancedBookingStats> {
    return this.http.get<EnhancedBookingStats>(`${this.apiUrl}/global`);
  }
}
