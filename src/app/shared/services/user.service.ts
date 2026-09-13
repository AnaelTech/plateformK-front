import { logger } from '../../shared/utils/logger';
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/Page';
import { User, UserRequest, TypeUser } from '../models/User';

const MAX_USER_PAGES = 500;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}users`;

  private readonly _currentUser = signal<User | null>(null);
  private readonly _usersCache = signal<User[]>([]);
  private readonly _loadingUsers = signal<boolean>(false);
  private readonly _loadingCurrentUser = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly users = this._usersCache.asReadonly();
  readonly loadingUsers = this._loadingUsers.asReadonly();
  readonly loadingCurrentUser = this._loadingCurrentUser.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  private readonly http = inject(HttpClient);

  getUsers(
    page = 0,
    size = 10,
    sortBy = 'id',
    direction = 'ASC',
  ): Observable<Page<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    this._loadingUsers.set(true);
    this._error.set(null);

    return this.http
      .get<Page<User>>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          this._usersCache.set(response.data);
          this._loadingUsers.set(false);
        }),
        catchError((error) => {
          this._error.set(error.message || 'Failed to load users');
          this._loadingUsers.set(false);
          throw error;
        }),
      );
  }

  /**
   * Récupère l'intégralité des utilisateurs en enchaînant les pages.
   *
   * L'API plafonne la taille de page (100) : demander une taille supérieure
   * ne renvoie que la première page. Cette méthode boucle sur `hasNext` afin
   * d'éviter toute troncature silencieuse (listes élèves/parents, statistiques).
   *
   * @param type filtre optionnel sur le type d'utilisateur
   * @returns la liste complète des utilisateurs (filtrée le cas échéant)
   */
  getAllUsers(type?: TypeUser, pageSize = 100): Observable<User[]> {
    const fetchPage = (page: number, acc: User[]): Observable<User[]> =>
      this.http
        .get<Page<User>>(this.apiUrl, {
          params: new HttpParams()
            .set('page', page.toString())
            .set('size', pageSize.toString())
            .set('sortBy', 'id')
            .set('direction', 'ASC'),
        })
        .pipe(
          switchMap((response) => {
            const users = response?.data ?? [];
            const all = [...acc, ...users];
            const hasMore =
              response?.pagination?.hasNext === true &&
              users.length > 0 &&
              page < MAX_USER_PAGES;
            return hasMore ? fetchPage(page + 1, all) : of(all);
          }),
        );

    return fetchPage(0, []).pipe(
      map((users) => (type ? users.filter((u) => u.typeUser === type) : users)),
    );
  }

  getUserById(id: number): Observable<User> {
    const cached = this._usersCache().find((u) => u.id === id);
    if (cached) return of(cached);

    if (this._currentUser()?.id === id) {
      return of(this._currentUser()!);
    }

    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getCurrentUser(): Observable<User> {
    this._loadingCurrentUser.set(true);
    this._error.set(null);

    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this._currentUser.set(user);
        this._loadingCurrentUser.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to load current user');
        this._loadingCurrentUser.set(false);
        throw error;
      }),
    );
  }

  createUser(user: UserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      tap((newUser) => {
        this._usersCache.update((users) => [...users, newUser]);
      }),
    );
  }

  updateUser(id: number, user: UserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user).pipe(
      tap((updatedUser) => {
        this._usersCache.update((users) =>
          users.map((u) => (u.id === id ? updatedUser : u)),
        );

        if (this._currentUser()?.id === id) {
          this._currentUser.set(updatedUser);
        }
      }),
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._usersCache.update((users) => users.filter((u) => u.id !== id));

        if (this._currentUser()?.id === id) {
          this._currentUser.set(null);
        }
      }),
    );
  }

  getParentsByStudentId(studentId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${studentId}/parents`);
  }

  /**
   * Récupère les noms complets des utilisateurs dont les ids sont fournis, en une
   * seule requête (endpoint batch `/users/names`).
   */
  getUserNamesByIds(ids: number[]): Observable<Map<number, string>> {
    const uniqueIds = [...new Set(ids)].filter((id) => id != null);
    if (uniqueIds.length === 0) {
      return of(new Map());
    }

    const params = new HttpParams().set('ids', uniqueIds.join(','));

    return this.http
      .get<{ id: number; firstName: string; lastName: string }[]>(`${this.apiUrl}/names`, {
        params,
      })
      .pipe(
        map((users) => {
          const names = new Map<number, string>();
          users.forEach((user) => {
            names.set(user.id, `${user.firstName} ${user.lastName}`);
          });
          return names;
        }),
        catchError(() => of(new Map<number, string>())),
      );
  }

  /**
   * Récupère le nombre d'utilisateurs d'un type donné (endpoint `/users/count`).
   */
  getUsersCount(type: TypeUser): Observable<number> {
    const params = new HttpParams().set('type', type);
    return this.http
      .get<{ typeUser: TypeUser; count: number }>(`${this.apiUrl}/count`, { params })
      .pipe(map((response) => response.count));
  }

  /**
   * Récupère les enfants d'un parent.
   */
  getChildrenByParentId(parentId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${parentId}/children`);
  }

  /**
   * Assigne un élève existant à un parent.
   */
  assignEleveToParent(parentId: number, eleveId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${parentId}/assign-eleve`, {
      eleveId,
    });
  }

  /**
   * Retire un élève d'un parent (supprime la relation).
   */
  removeEleveFromParent(parentId: number, eleveId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${parentId}/remove-eleve/${eleveId}`,
    );
  }

  clearCache(): void {
    this._usersCache.set([]);
    this._currentUser.set(null);
    this._error.set(null);
  }

  refreshCurrentUser(): void {
    this.getCurrentUser().subscribe({
      error: (e) => logger.error('[UserService] Failed to refresh user', e),
    });
  }

  /**
   * Crée un compte enfant et établit la relation avec le parent.
   */
  createChild(
    request: import('../models/child.model').CreateChildRequest,
  ): Observable<import('../models/child.model').CreateChildResponse> {
    return this.http.post<import('../models/child.model').CreateChildResponse>(
      `${this.apiUrl}/child`,
      request,
    );
  }
}
