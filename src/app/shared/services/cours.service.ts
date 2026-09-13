import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/Page';
import {
  CoursSession,
  CoursStatus,
  CreateCoursRequest,
  UpdateCoursRequest,
  CompletedUnbilledCours,
} from '../models/Cours';

@Injectable({
  providedIn: 'root',
})
export class CoursService {
  private readonly apiUrl = `${environment.apiUrl}courses`;

  private readonly _coursList = signal<CoursSession[]>([]);
  private readonly _selectedCours = signal<CoursSession | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalElements = signal<number>(0);

  readonly coursList = this._coursList.asReadonly();
  readonly selectedCours = this._selectedCours.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();

  readonly activeCours = computed(() =>
    this._coursList().filter((cours) => cours.statut === CoursStatus.PENDING),
  );

  private readonly http = inject(HttpClient);

  getAllCours(
    page = 0,
    size = 10,
    sortBy = 'id',
    direction = 'ASC',
  ): Observable<Page<CoursSession>> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http
      .get<Page<CoursSession>>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          if (page === 0) {
            this._coursList.set(response.data);
          } else {
            this._coursList.update((current) => {
              const existingIds = new Set(current.map((c) => c.id));
              const newCours = response.data.filter(
                (c) => !existingIds.has(c.id),
              );
              return [...current, ...newCours];
            });
          }
          this._totalElements.set(response.pagination.totalElements);
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(error.message || 'Failed to load cours');
          this._loading.set(false);
          throw error;
        }),
      );
  }

  getCoursById(id: number): Observable<CoursSession> {
    const cached = this._coursList().find((c) => c.id === id);
    if (cached) return of(cached);

    return this.http.get<CoursSession>(`${this.apiUrl}/${id}`).pipe(
      tap((cours) => {
        this._coursList.update((current) => {
          if (!current.some((c) => c.id === id)) {
            return [...current, cours];
          }
          return current;
        });
      }),
    );
  }

  createCours(cours: CreateCoursRequest): Observable<CoursSession> {
    return this.http.post<CoursSession>(this.apiUrl, cours).pipe(
      tap((newCours) => {
        this._coursList.update((current) => [newCours, ...current]);
        this._totalElements.update((total) => total + 1);
      }),
    );
  }

  updateCours(id: number, cours: UpdateCoursRequest): Observable<CoursSession> {
    return this.http.put<CoursSession>(`${this.apiUrl}/${id}`, cours).pipe(
      tap((updatedCours) => {
        this._coursList.update((current) =>
          current.map((c) => (c.id === id ? updatedCours : c)),
        );
        if (this._selectedCours()?.id === id) {
          this._selectedCours.set(updatedCours);
        }
      }),
    );
  }

  /**
   * Get all available cours (slots without bookings)
   * @param page Page number (0-based)
   * @param size Page size
   * @param sortBy Sort field
   * @param direction Sort direction (ASC/DESC)
   */
  getAvailableCours(
    page = 0,
    size = 10,
    sortBy = 'sessionDate',
    direction = 'ASC',
  ): Observable<Page<CoursSession>> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http
      .get<Page<CoursSession>>(`${this.apiUrl}/available`, { params })
      .pipe(
        tap(() => {
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(error.message || 'Failed to load available cours');
          this._loading.set(false);
          throw error;
        }),
      );
  }

  /**
   * Get available cours for a specific teacher
   * @param teacherId Teacher's user ID
   */
  getAvailableCoursByTeacher(teacherId: number): Observable<CoursSession[]> {
    return this.http.get<CoursSession[]>(
      `${this.apiUrl}/teacher/${teacherId}/available`,
    );
  }

  /**
   * Get available cours for a specific subject/matiere
   * @param matiere Subject name
   */
  getAvailableCoursByMatiere(matiere: string): Observable<CoursSession[]> {
    return this.http.get<CoursSession[]>(
      `${this.apiUrl}/matiere/${matiere}/available`,
    );
  }

  deleteCours(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._coursList.update((current) => current.filter((c) => c.id !== id));
        this._totalElements.update((total) => total - 1);
        if (this._selectedCours()?.id === id) {
          this._selectedCours.set(null);
        }
      }),
    );
  }

  selectCours(cours: CoursSession | null): void {
    this._selectedCours.set(cours);
  }

  clearCache(): void {
    this._coursList.set([]);
    this._selectedCours.set(null);
    this._totalElements.set(0);
    this._error.set(null);
  }

  refreshCours(): void {
    this.getAllCours().subscribe();
  }

  /**
   * Get completed courses that are not yet billed.
   * Used by teachers to select courses for invoice creation.
   */
  getCompletedUnbilledCours(): Observable<CompletedUnbilledCours[]> {
    return this.http.get<CompletedUnbilledCours[]>(
      `${this.apiUrl}/completed-unbilled`,
    );
  }
}
