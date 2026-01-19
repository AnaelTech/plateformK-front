import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
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
  private readonly apiUrl = `${environment.apiUrl}/api/availabilities`;

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
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to create availability');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  getAvailabilitiesByTeacher(teacherId: number): Observable<Availability[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<Availability[]>(`${this.apiUrl}/teacher/${teacherId}`)
      .pipe(
        tap((availabilities) => {
          this._availabilities.set(availabilities);
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(
            error.message || 'Failed to load teacher availabilities',
          );
          this._loading.set(false);
          return of([]);
        }),
      );
  }

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
        tap(() => {
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(
            error.message || 'Failed to load availabilities by date range',
          );
          this._loading.set(false);
          return of([]);
        }),
      );
  }

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
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(error.message || 'Failed to update availability');
          this._loading.set(false);
          throw error;
        }),
      );
  }

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
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to delete availability');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  // Bulk operations for managing multiple availabilities
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
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(
            error.message || 'Failed to create multiple availabilities',
          );
          this._loading.set(false);
          throw error;
        }),
      );
  }

  selectAvailability(availability: Availability | null): void {
    this._selectedAvailability.set(availability);
  }

  clearCache(): void {
    this._availabilities.set([]);
    this._selectedAvailability.set(null);
    this._error.set(null);
  }

  refreshAvailabilities(): void {
    // This would typically be called with a teacherId
    // For now, just clear the error state
    this._error.set(null);
  }
}
