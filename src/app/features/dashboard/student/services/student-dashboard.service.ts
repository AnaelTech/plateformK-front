import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';
import { User } from '../../../../shared/models/User';
import { Booking, BookingStats } from '../../../../shared/models/Booking';
import { Cours } from '../../../../shared/models/Cours';
import { Teacher } from '../../../../shared/models/Student';
import { Page } from '../../../../shared/models/Page';

@Injectable({
  providedIn: 'root',
})
export class StudentDashboardService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}users/me`);
  }

  getStudentBookings(studentId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.apiUrl}bookings/eleve/${studentId}`,
    );
  }

  getBookingStats(): Observable<BookingStats> {
    return this.http.get<BookingStats>(`${this.apiUrl}bookings/stats`);
  }

  getAllCourses(): Observable<Cours[]> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '100')
      .set('sortBy', 'dateCours')
      .set('direction', 'ASC');

    return this.http
      .get<Page<Cours>>(`${this.apiUrl}/cours`, { params })
      .pipe(map((response) => response.data));
  }

  getAvailableSlots(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<any[]>(`${this.apiUrl}availabilities/range`, {
      params,
    });
  }

  getTeachers(): Observable<Teacher[]> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '100')
      .set('sortBy', 'firstName')
      .set('direction', 'ASC');

    return this.http.get<Page<User>>(`${this.apiUrl}users`, { params }).pipe(
      map((response) =>
        response.data
          .filter((user: any) => user.typeUser === 'PROFESSEUR')
          .map((user: any) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            subject: 'Non spécifié',
          })),
      ),
    );
  }
}
