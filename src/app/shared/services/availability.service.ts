import { Injectable, signal, computed } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Availability,
  CreateAvailabilityRequest,
  UpdateAvailabilityRequest,
  AvailabilitySlot,
} from '../models/Availability';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  private readonly apiUrl = `${environment.apiUrl}availabilities`;

  constructor(private readonly http: HttpClient) {}

  private readonly _availabilities = signal<Availability[]>([]);
  private readonly _selectedAvailability = signal<Availability | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly availabilities = this._availabilities.asReadonly();
  readonly selectedAvailability = this._selectedAvailability.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals for filtered availabilities
  readonly availableSlots = computed(() =>
    this._availabilities().filter((availability) => availability.isAvailable),
  );

  readonly unavailableSlots = computed(() =>
    this._availabilities().filter((availability) => !availability.isAvailable),
  );

  /**
   * Crée une nouvelle disponibilité
   */
  createAvailability(
    availabilityRequest: CreateAvailabilityRequest,
  ): Observable<Availability> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<Availability>(this.apiUrl, availabilityRequest).pipe(
      tap((availability) => {
        this._availabilities.update((availabilities) => [
          availability,
          ...availabilities,
        ]);
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.extractErrorMessage(
          error,
          'Failed to create availability',
        );
        this._error.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  /**
   * Récupère les disponibilités d'un professeur
   */
  getAvailabilitiesByTeacher(teacherId: number): Observable<Availability[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Availability[]>(`${this.apiUrl}/teacher/${teacherId}`)
      .pipe(
        tap((availabilities) => {
          this._availabilities.set(availabilities);
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.extractErrorMessage(
            error,
            'Failed to load teacher availabilities',
          );
          this._error.set(errorMessage);
          return throwError(() => new Error(errorMessage));
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      );
  }

  /**
   * Récupère les disponibilités par période
   */
  getAvailabilitiesByDateRange(
    startDate: string,
    endDate: string,
  ): Observable<AvailabilitySlot[]> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http
      .get<AvailabilitySlot[]>(`${this.apiUrl}/range`, { params })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.extractErrorMessage(
            error,
            'Failed to load availabilities by date range',
          );
          this._error.set(errorMessage);
          return throwError(() => new Error(errorMessage));
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      );
  }

  /**
   * Met à jour une disponibilité existante
   */
  updateAvailability(
    id: number,
    updateRequest: UpdateAvailabilityRequest,
  ): Observable<Availability> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<Availability>(`${this.apiUrl}/${id}`, updateRequest)
      .pipe(
        tap((updatedAvailability) => {
          this._availabilities.update((availabilities) =>
            availabilities.map((availability) =>
              availability.id === id ? updatedAvailability : availability,
            ),
          );
          if (this._selectedAvailability()?.id === id) {
            this._selectedAvailability.set(updatedAvailability);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.extractErrorMessage(
            error,
            'Failed to update availability',
          );
          this._error.set(errorMessage);
          return throwError(() => new Error(errorMessage));
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      );
  }

  /**
   * Supprime une disponibilité
   */
  deleteAvailability(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._availabilities.update((availabilities) =>
          availabilities.filter((availability) => availability.id !== id),
        );
        if (this._selectedAvailability()?.id === id) {
          this._selectedAvailability.set(null);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.extractErrorMessage(
          error,
          'Failed to delete availability',
        );
        this._error.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  /**
   * Crée plusieurs disponibilités en une seule requête
   */
  createMultipleAvailabilities(
    availabilityRequests: CreateAvailabilityRequest[],
  ): Observable<Availability[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<Availability[]>(`${this.apiUrl}/bulk`, availabilityRequests)
      .pipe(
        tap((availabilities) => {
          this._availabilities.update((current) => [
            ...availabilities,
            ...current,
          ]);
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.extractErrorMessage(
            error,
            'Failed to create multiple availabilities',
          );
          this._error.set(errorMessage);
          return throwError(() => new Error(errorMessage));
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      );
  }

  /**
   * Sélectionne une disponibilité
   */
  selectAvailability(availability: Availability | null): void {
    this._selectedAvailability.set(availability);
  }

  /**
   * Vide le cache du service
   */
  clearCache(): void {
    this._availabilities.set([]);
    this._selectedAvailability.set(null);
    this._error.set(null);
  }

  /**
   * Réinitialise l'état d'erreur
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Rafraîchit les disponibilités pour un professeur donné
   */
  refreshAvailabilities(teacherId?: number): Observable<Availability[]> | void {
    if (teacherId) {
      return this.getAvailabilitiesByTeacher(teacherId);
    }
    this._error.set(null);
  }

  /**
   * Extrait le message d'erreur d'une HttpErrorResponse
   */
  private extractErrorMessage(
    error: HttpErrorResponse,
    defaultMessage: string,
  ): string {
    // Erreur côté client (réseau, etc.)
    if (error.error instanceof ErrorEvent) {
      return `Client error: ${error.error.message}`;
    }

    // Erreur côté serveur
    let message = defaultMessage;

    // Cas 1: Le backend renvoie un objet avec une propriété 'message'
    if (error.error?.message) {
      message = error.error.message;
    }
    // Cas 2: Le backend renvoie directement une chaîne
    else if (typeof error.error === 'string') {
      message = error.error;
    }
    // Cas 3: Utiliser le message HTTP par défaut
    else if (error.message) {
      message = error.message;
    }

    // Ajouter le contexte du code de statut
    switch (error.status) {
      case 400:
        return `Validation error: ${message}`;
      case 404:
        return `Resource not found: ${message}`;
      case 409:
        return `Conflict: ${message}`;
      case 500:
        return `Server error: ${message}`;
      case 0:
        return 'Network error: Unable to connect to server';
      default:
        return message;
    }
  }
}
