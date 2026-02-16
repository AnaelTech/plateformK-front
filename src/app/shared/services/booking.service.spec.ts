import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BookingService } from './booking.service';
import {
  Booking,
  BookingRequest,
  BookingStatus,
  BookingUpdateRequest,
  BookingStats,
  CompleteBookingRequest,
} from '../models/Booking';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  const mockBooking: Booking = {
    id: 1,
    coursId: 10,
    coursTitre: 'Mathématiques Avancées',
    coursMatiere: 'Mathématiques',
    coursDate: '2024-03-20T10:00:00',
    coursDureeMinutes: 60,
    coursTarif: 35,
    parentId: 100,
    parentName: 'Marie Dupont',
    eleveId: 200,
    eleveName: 'Lucas Dupont',
    createdAt: '2024-03-15T08:00:00',
    updatedAt: '2024-03-15T08:00:00',
    notes: 'Préparation bac',
    status: BookingStatus.PENDING,
  };

  const mockBookings: Booking[] = [
    mockBooking,
    {
      ...mockBooking,
      id: 2,
      status: BookingStatus.CONFIRMED,
      coursTitre: 'Physique',
    },
    {
      ...mockBooking,
      id: 3,
      status: BookingStatus.COMPLETED,
      coursTitre: 'Chimie',
    },
    {
      ...mockBooking,
      id: 4,
      status: BookingStatus.CANCELLED,
      coursTitre: 'Biologie',
    },
  ];

  const mockPaginatedResponse = {
    data: mockBookings,
    pagination: {
      currentPage: 0,
      pageSize: 10,
      totalElements: 4,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
      isFirst: true,
      isLast: true,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BookingService],
    });

    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  describe('Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial empty state', () => {
      expect(service.bookings()).toEqual([]);
      expect(service.selectedBooking()).toBeNull();
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  describe('createBooking', () => {
    it('should create a booking successfully', fakeAsync(() => {
      const request: BookingRequest = {
        coursId: 10,
        eleveId: 200,
        notes: 'Préparation bac',
      };

      service.createBooking(request).subscribe((booking) => {
        expect(booking).toEqual(mockBooking);
        expect(service.bookings().length).toBe(1);
        expect(service.bookings()[0]).toEqual(mockBooking);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/bookings');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockBooking);

      tick();
      expect(service.loading()).toBe(false);
    }));

    it('should handle creation error', fakeAsync(() => {
      const request: BookingRequest = {
        coursId: 10,
        eleveId: 200,
      };

      let errorCaught = false;
      service.createBooking(request).subscribe({
        error: () => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/bookings');
      req.error(new ErrorEvent('Network error'));

      tick();
      expect(errorCaught).toBe(true);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeTruthy();
    }));
  });

  describe('getBookingById', () => {
    it('should fetch a booking by id', fakeAsync(() => {
      service.getBookingById(1).subscribe((booking) => {
        expect(booking).toEqual(mockBooking);
        expect(service.selectedBooking()).toEqual(mockBooking);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/bookings/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockBooking);

      tick();
      expect(service.loading()).toBe(false);
    }));
  });

  describe('getBookings', () => {
    it('should fetch paginated bookings', fakeAsync(() => {
      service.getBookings(0, 10).subscribe((response) => {
        expect(response.data.length).toBe(4);
        expect(response.pagination.totalElements).toBe(4);
        expect(service.bookings().length).toBe(4);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=0&size=10',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);

      tick();
      expect(service.loading()).toBe(false);
    }));

    it('should append bookings when page > 0', fakeAsync(() => {
      // First page
      service.getBookings(0, 2).subscribe();
      const req1 = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=0&size=2',
      );
      req1.flush({
        data: [mockBookings[0], mockBookings[1]],
        pagination: { ...mockPaginatedResponse.pagination, hasNext: true },
      });
      tick();

      expect(service.bookings().length).toBe(2);

      // Second page
      service.getBookings(1, 2).subscribe();
      const req2 = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=1&size=2',
      );
      req2.flush({
        data: [mockBookings[2], mockBookings[3]],
        pagination: { ...mockPaginatedResponse.pagination, currentPage: 1 },
      });
      tick();

      expect(service.bookings().length).toBe(4);
    }));

    it('should handle fetch error gracefully', fakeAsync(() => {
      service.getBookings().subscribe((response) => {
        expect(response.data).toEqual([]);
        expect(response.pagination.totalElements).toBe(0);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=0&size=10',
      );
      req.error(new ErrorEvent('Network error'));

      tick();
      expect(service.loading()).toBe(false);
    }));
  });

  describe('getBookingsByParent', () => {
    it('should fetch bookings by parent id', fakeAsync(() => {
      service.getBookingsByParent(100).subscribe((bookings) => {
        expect(bookings.length).toBe(4);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/parent/100',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockBookings);

      tick();
    }));
  });

  describe('getBookingsByEleve', () => {
    it('should fetch bookings by eleve id', fakeAsync(() => {
      service.getBookingsByEleve(200).subscribe((bookings) => {
        expect(bookings.length).toBe(4);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/eleve/200',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockBookings);

      tick();
    }));
  });

  describe('updateBooking', () => {
    it('should update a booking', fakeAsync(() => {
      // Setup initial state
      service.getBookings().subscribe();
      const getReq = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=0&size=10',
      );
      getReq.flush(mockPaginatedResponse);
      tick();

      const updateRequest: BookingUpdateRequest = {
        status: BookingStatus.CONFIRMED,
        notes: 'Updated notes',
      };

      const updatedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        notes: 'Updated notes',
      };

      service.updateBooking(1, updateRequest).subscribe((booking) => {
        expect(booking.status).toBe(BookingStatus.CONFIRMED);
        expect(booking.notes).toBe('Updated notes');
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/bookings/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updatedBooking);

      tick();

      const updated = service.bookings().find((b) => b.id === 1);
      expect(updated?.status).toBe(BookingStatus.CONFIRMED);
    }));
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', fakeAsync(() => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };

      service.cancelBooking(1).subscribe((booking) => {
        expect(booking.status).toBe(BookingStatus.CANCELLED);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/1/cancel',
      );
      expect(req.request.method).toBe('PUT');
      req.flush(cancelledBooking);

      tick();
    }));
  });

  describe('confirmBooking', () => {
    it('should confirm a booking', fakeAsync(() => {
      const confirmedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };

      service.confirmBooking(1, { statut: BookingStatus.CONFIRMED }).subscribe((booking) => {
        expect(booking.status).toBe(BookingStatus.CONFIRMED);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/1/confirm',
      );
      expect(req.request.method).toBe('PUT');
      req.flush(confirmedBooking);

      tick();
    }));
  });

  describe('completeBooking', () => {
    it('should complete a booking with feedback', fakeAsync(() => {
      const completedBooking = {
        ...mockBooking,
        status: BookingStatus.COMPLETED,
        notionsCovered: 'Algèbre, Géométrie',
        teacherFeedback: 'Excellent travail!',
      };

      const request: CompleteBookingRequest = {
        notionsCovered: 'Algèbre, Géométrie',
        teacherFeedback: 'Excellent travail!',
      };

      service.completeBooking(1, request).subscribe((booking) => {
        expect(booking.status).toBe(BookingStatus.COMPLETED);
        expect(booking.teacherFeedback).toBe('Excellent travail!');
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/1/complete',
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(completedBooking);

      tick();
    }));
  });

  describe('deleteBooking', () => {
    it('should delete a booking', fakeAsync(() => {
      // Setup initial state
      service.getBookings().subscribe();
      const getReq = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=0&size=10',
      );
      getReq.flush(mockPaginatedResponse);
      tick();

      expect(service.bookings().length).toBe(4);

      service.deleteBooking(1).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/bookings/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      tick();

      expect(service.bookings().length).toBe(3);
      expect(service.bookings().find((b) => b.id === 1)).toBeUndefined();
    }));
  });

  describe('getBookingStats', () => {
    it('should fetch booking stats', fakeAsync(() => {
      const mockStats: BookingStats = {
        totalBookings: 100,
        pendingBookings: 20,
        confirmedBookings: 30,
        completedBookings: 40,
        cancelledBookings: 10,
      };

      service.getBookingStats().subscribe((stats) => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/stats',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);

      tick();
    }));

    it('should return empty stats on error', fakeAsync(() => {
      service.getBookingStats().subscribe((stats) => {
        expect(stats.totalBookings).toBe(0);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/stats',
      );
      req.error(new ErrorEvent('Network error'));

      tick();
    }));
  });

  describe('bookingExists', () => {
    it('should check if booking exists', fakeAsync(() => {
      service.bookingExists(10, 200).subscribe((exists) => {
        expect(exists).toBe(true);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings/exists?coursId=10&eleveId=200',
      );
      expect(req.request.method).toBe('GET');
      req.flush(true);

      tick();
    }));
  });

  describe('Computed signals', () => {
    it('should filter bookings by status', fakeAsync(() => {
      service.getBookings().subscribe();
      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=0&size=10',
      );
      req.flush(mockPaginatedResponse);
      tick();

      expect(service.pendingBookings().length).toBe(1);
      expect(service.confirmedBookings().length).toBe(1);
      expect(service.completedBookings().length).toBe(1);
      expect(service.cancelledBookings().length).toBe(1);
    }));
  });

  describe('selectBooking', () => {
    it('should select a booking', () => {
      service.selectBooking(mockBooking);
      expect(service.selectedBooking()).toEqual(mockBooking);
    });

    it('should clear selection with null', () => {
      service.selectBooking(mockBooking);
      service.selectBooking(null);
      expect(service.selectedBooking()).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all state', fakeAsync(() => {
      service.getBookings().subscribe();
      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/bookings?page=0&size=10',
      );
      req.flush(mockPaginatedResponse);
      tick();

      service.selectBooking(mockBooking);

      service.clearCache();

      expect(service.bookings()).toEqual([]);
      expect(service.selectedBooking()).toBeNull();
      expect(service.error()).toBeNull();
    }));
  });
});
