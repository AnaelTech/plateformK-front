import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Booking,
  BookingRequest,
  BookingUpdateRequest,
  BookingStats,
  BookingStatus,
} from '../models/Booking';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly apiUrl = `${environment.apiUrl}/api/bookings`;

  constructor(private readonly http: HttpClient) {}

  private readonly _bookings = signal<Booking[]>([]);
  private readonly _selectedBooking = signal<Booking | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly bookings = this._bookings.asReadonly();
  readonly selectedBooking = this._selectedBooking.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly pendingBookings = computed(() =>
    this._bookings().filter(
      (booking) => booking.status === BookingStatus.PENDING,
    ),
  );

  readonly confirmedBookings = computed(() =>
    this._bookings().filter(
      (booking) => booking.status === BookingStatus.CONFIRMED,
    ),
  );

  readonly completedBookings = computed(() =>
    this._bookings().filter(
      (booking) => booking.status === BookingStatus.COMPLETED,
    ),
  );

  readonly cancelledBookings = computed(() =>
    this._bookings().filter(
      (booking) => booking.status === BookingStatus.CANCELLED,
    ),
  );

  createBooking(bookingRequest: BookingRequest): Observable<Booking> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<Booking>(this.apiUrl, bookingRequest).pipe(
      tap((booking) => {
        this._bookings.update((bookings) => [booking, ...bookings]);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to create booking');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  getBookingById(id: number): Observable<Booking> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Booking>(`${this.apiUrl}/${id}`).pipe(
      tap((booking) => {
        this._selectedBooking.set(booking);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to load booking');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  getBookings(
    page: number = 0,
    size: number = 10,
  ): Observable<{
    content: Booking[];
    totalElements: number;
    totalPages: number;
  }> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<{
        content: Booking[];
        totalElements: number;
        totalPages: number;
      }>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          if (page === 0) {
            this._bookings.set(response.content);
          } else {
            this._bookings.update((current) => [
              ...current,
              ...response.content,
            ]);
          }
          this._loading.set(false);
        }),
        catchError((error) => {
          this._error.set(error.message || 'Failed to load bookings');
          this._loading.set(false);
          return of({ content: [], totalElements: 0, totalPages: 0 });
        }),
      );
  }

  getBookingsByParent(parentId: number): Observable<Booking[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Booking[]>(`${this.apiUrl}/parent/${parentId}`).pipe(
      tap((bookings) => {
        this._bookings.set(bookings);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to load parent bookings');
        this._loading.set(false);
        return of([]);
      }),
    );
  }

  getBookingsByEleve(eleveId: number): Observable<Booking[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Booking[]>(`${this.apiUrl}/eleve/${eleveId}`).pipe(
      tap((bookings) => {
        this._bookings.set(bookings);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to load eleve bookings');
        this._loading.set(false);
        return of([]);
      }),
    );
  }

  updateBooking(
    id: number,
    updateRequest: BookingUpdateRequest,
  ): Observable<Booking> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<Booking>(`${this.apiUrl}/${id}`, updateRequest).pipe(
      tap((updatedBooking) => {
        this._bookings.update((bookings) =>
          bookings.map((booking) =>
            booking.id === id ? updatedBooking : booking,
          ),
        );
        if (this._selectedBooking()?.id === id) {
          this._selectedBooking.set(updatedBooking);
        }
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to update booking');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  cancelBooking(id: number): Observable<Booking> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<Booking>(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      tap((cancelledBooking) => {
        this._bookings.update((bookings) =>
          bookings.map((booking) =>
            booking.id === id ? cancelledBooking : booking,
          ),
        );
        if (this._selectedBooking()?.id === id) {
          this._selectedBooking.set(cancelledBooking);
        }
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to cancel booking');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  confirmBooking(id: number, p0: { statut: any }): Observable<Booking> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<Booking>(`${this.apiUrl}/${id}/confirm`, {}).pipe(
      tap((confirmedBooking) => {
        this._bookings.update((bookings) =>
          bookings.map((booking) =>
            booking.id === id ? confirmedBooking : booking,
          ),
        );
        if (this._selectedBooking()?.id === id) {
          this._selectedBooking.set(confirmedBooking);
        }
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to confirm booking');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  completeBooking(id: number): Observable<Booking> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<Booking>(`${this.apiUrl}/${id}/complete`, {}).pipe(
      tap((completedBooking) => {
        this._bookings.update((bookings) =>
          bookings.map((booking) =>
            booking.id === id ? completedBooking : booking,
          ),
        );
        if (this._selectedBooking()?.id === id) {
          this._selectedBooking.set(completedBooking);
        }
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to complete booking');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  deleteBooking(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._bookings.update((bookings) =>
          bookings.filter((booking) => booking.id !== id),
        );
        if (this._selectedBooking()?.id === id) {
          this._selectedBooking.set(null);
        }
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to delete booking');
        this._loading.set(false);
        throw error;
      }),
    );
  }

  getBookingStats(): Observable<BookingStats> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<BookingStats>(`${this.apiUrl}/stats`).pipe(
      tap((stats) => {
        this._loading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.message || 'Failed to load booking stats');
        this._loading.set(false);
        return of({
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
        });
      }),
    );
  }

  bookingExists(coursId: number, eleveId: number): Observable<boolean> {
    const params = new HttpParams()
      .set('coursId', coursId.toString())
      .set('eleveId', eleveId.toString());

    return this.http.get<boolean>(`${this.apiUrl}/exists`, { params });
  }

  selectBooking(booking: Booking | null): void {
    this._selectedBooking.set(booking);
  }

  clearCache(): void {
    this._bookings.set([]);
    this._selectedBooking.set(null);
    this._error.set(null);
  }

  refreshBookings(): void {
    this.getBookings().subscribe();
  }
}
