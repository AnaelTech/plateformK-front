import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cours,
  CoursStatus,
  CreateCoursRequest,
  UpdateCoursRequest,
  AssignEleveRequest,
} from '../models/Cours';

@Injectable({
  providedIn: 'root',
})
export class CoursService {
  private readonly apiUrl = `${environment.apiUrl}/cours`;

  private readonly _coursList = signal<Cours[]>([]);
  private readonly _selectedCours = signal<Cours | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalElements = signal<number>(0);

  readonly coursList = this._coursList.asReadonly();
  readonly selectedCours = this._selectedCours.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();

  readonly activeCours = computed(() =>
    this._coursList().filter((cours) => cours.statut === CoursStatus.PENDING)
  );

  constructor(private readonly http: HttpClient) {}

  getAllCours(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'id',
    direction: string = 'ASC'
  ): Observable<{
    content: Cours[];
    totalElements: number;
    totalPages: number;
  }> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http
      .get<{ content: Cours[]; totalElements: number; totalPages: number }>(
        this.apiUrl,
        { params }
      )
      .pipe(
        tap((response) => {
          if (page === 0) {
            this._coursList.set(response.content);
          } else {
            this._coursList.update((current) => {
              const existingIds = new Set(current.map((c) => c.id));
              const newCours = response.content.filter(
                (c) => !existingIds.has(c.id)
              );
              return [...current, ...newCours];
            });
          }
          this._totalElements.set(response.totalElements);
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(error.message || 'Failed to load cours');
          this._loading.set(false);
          throw error;
        })
      );
  }

  getCoursById(id: number): Observable<Cours> {
    const cached = this._coursList().find((c) => c.id === id);
    if (cached) return of(cached);

    return this.http.get<Cours>(`${this.apiUrl}/${id}`).pipe(
      tap((cours) => {
        this._coursList.update((current) => {
          if (!current.some((c) => c.id === id)) {
            return [...current, cours];
          }
          return current;
        });
      })
    );
  }

  createCours(cours: CreateCoursRequest): Observable<Cours> {
    return this.http.post<Cours>(this.apiUrl, cours).pipe(
      tap((newCours) => {
        this._coursList.update((current) => [newCours, ...current]);
        this._totalElements.update((total) => total + 1);
      })
    );
  }

  updateCours(id: number, cours: UpdateCoursRequest): Observable<Cours> {
    return this.http.put<Cours>(`${this.apiUrl}/${id}`, cours).pipe(
      tap((updatedCours) => {
        this._coursList.update((current) =>
          current.map((c) => (c.id === id ? updatedCours : c))
        );
        if (this._selectedCours()?.id === id) {
          this._selectedCours.set(updatedCours);
        }
      })
    );
  }

  assignEleve(id: number, request: AssignEleveRequest): Observable<Cours> {
    return this.http
      .put<Cours>(`${this.apiUrl}/${id}/assign-eleve`, request)
      .pipe(
        tap((updatedCours) => {
          this._coursList.update((current) =>
            current.map((c) => (c.id === id ? updatedCours : c))
          );
          if (this._selectedCours()?.id === id) {
            this._selectedCours.set(updatedCours);
          }
        })
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
      })
    );
  }

  selectCours(cours: Cours | null): void {
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
}
