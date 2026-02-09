import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User, UserRequest, TypeUser } from '../models/User';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    typeUser: TypeUser.PROFESSEUR,
    emailValid: true,
    registrationDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    birthDate: '1990-01-15',
    phoneNumber: '0612345678',
    city: 'Paris',
    address: '123 Rue de la Paix',
    postalCode: 75001,
  };

  const mockUsers: User[] = [
    mockUser,
    {
      ...mockUser,
      id: 2,
      email: 'parent@example.com',
      firstName: 'Marie',
      lastName: 'Dupont',
      typeUser: TypeUser.PARENT,
    },
    {
      ...mockUser,
      id: 3,
      email: 'eleve@example.com',
      firstName: 'Lucas',
      lastName: 'Martin',
      typeUser: TypeUser.ELEVE,
    },
  ];

  const mockPaginatedResponse = {
    data: mockUsers,
    pagination: {
      currentPage: 0,
      pageSize: 10,
      totalElements: 3,
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
      providers: [UserService],
    });

    service = TestBed.inject(UserService);
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
      expect(service.currentUser()).toBeNull();
      expect(service.users()).toEqual([]);
      expect(service.loadingUsers()).toBe(false);
      expect(service.loadingCurrentUser()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getUsers', () => {
    it('should fetch paginated users', fakeAsync(() => {
      service.getUsers(0, 10).subscribe((response) => {
        expect(response.data.length).toBe(3);
        expect(response.pagination.totalElements).toBe(3);
        expect(service.users().length).toBe(3);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/users?page=0&size=10&sortBy=id&direction=ASC',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);

      tick();
      expect(service.loadingUsers()).toBe(false);
    }));

    it('should handle fetch error', fakeAsync(() => {
      let errorCaught = false;

      service.getUsers().subscribe({
        error: () => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/users?page=0&size=10&sortBy=id&direction=ASC',
      );
      req.error(new ErrorEvent('Network error'));

      tick();
      expect(errorCaught).toBe(true);
      expect(service.loadingUsers()).toBe(false);
      expect(service.error()).toBeTruthy();
    }));
  });

  describe('getUserById', () => {
    it('should return cached user if available', fakeAsync(() => {
      // First load users
      service.getUsers().subscribe();
      const getReq = httpMock.expectOne(
        'http://localhost:8080/api/v1/users?page=0&size=10&sortBy=id&direction=ASC',
      );
      getReq.flush(mockPaginatedResponse);
      tick();

      // Should return from cache without HTTP request
      service.getUserById(1).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      // No additional HTTP request should be made
      httpMock.expectNone('http://localhost:8080/api/v1/users/1');
    }));

    it('should fetch user if not in cache', fakeAsync(() => {
      service.getUserById(99).subscribe((user) => {
        expect(user.id).toBe(99);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users/99');
      expect(req.request.method).toBe('GET');
      req.flush({ ...mockUser, id: 99 });

      tick();
    }));
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', fakeAsync(() => {
      service.getCurrentUser().subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);

      tick();
      expect(service.loadingCurrentUser()).toBe(false);
    }));
  });

  describe('createUser', () => {
    it('should create a new user', fakeAsync(() => {
      const newUser: UserRequest = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        typeUser: TypeUser.PARENT,
      };

      const createdUser: User = {
        ...mockUser,
        id: 100,
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        typeUser: TypeUser.PARENT,
      };

      service.createUser(newUser).subscribe((user) => {
        expect(user.email).toBe('new@example.com');
        expect(service.users()).toContain(user);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users');
      expect(req.request.method).toBe('POST');
      req.flush(createdUser);

      tick();
    }));
  });

  describe('updateUser', () => {
    it('should update a user', fakeAsync(() => {
      // Setup initial state
      service.getUsers().subscribe();
      const getReq = httpMock.expectOne(
        'http://localhost:8080/api/v1/users?page=0&size=10&sortBy=id&direction=ASC',
      );
      getReq.flush(mockPaginatedResponse);
      tick();

      const updateRequest: UserRequest = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        typeUser: TypeUser.PROFESSEUR,
      };

      const updatedUser = { ...mockUser, ...updateRequest };

      service.updateUser(1, updateRequest).subscribe((user) => {
        expect(user.email).toBe('updated@example.com');
        expect(user.firstName).toBe('Updated');
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updatedUser);

      tick();

      const updated = service.users().find((u) => u.id === 1);
      expect(updated?.email).toBe('updated@example.com');
    }));

    it('should update currentUser if it is the same user', fakeAsync(() => {
      // Set current user
      service.getCurrentUser().subscribe();
      const meReq = httpMock.expectOne('http://localhost:8080/api/v1/users/me');
      meReq.flush(mockUser);
      tick();

      const updateRequest: UserRequest = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        typeUser: TypeUser.PROFESSEUR,
      };

      const updatedUser = { ...mockUser, ...updateRequest };

      service.updateUser(1, updateRequest).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users/1');
      req.flush(updatedUser);

      tick();

      expect(service.currentUser()?.email).toBe('updated@example.com');
    }));
  });

  describe('deleteUser', () => {
    it('should delete a user', fakeAsync(() => {
      // Setup initial state
      service.getUsers().subscribe();
      const getReq = httpMock.expectOne(
        'http://localhost:8080/api/v1/users?page=0&size=10&sortBy=id&direction=ASC',
      );
      getReq.flush(mockPaginatedResponse);
      tick();

      expect(service.users().length).toBe(3);

      service.deleteUser(1).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      tick();

      expect(service.users().length).toBe(2);
      expect(service.users().find((u) => u.id === 1)).toBeUndefined();
    }));
  });

  describe('Parent-Child relationships', () => {
    it('should get parents by student id', fakeAsync(() => {
      service.getParentsByStudentId(200).subscribe((parents) => {
        expect(parents.length).toBe(1);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/users/200/parents',
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockUsers[1]]);

      tick();
    }));

    it('should get children by parent id', fakeAsync(() => {
      service.getChildrenByParentId(100).subscribe((children) => {
        expect(children.length).toBe(1);
      });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/users/100/children',
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockUsers[2]]);

      tick();
    }));

    it('should assign eleve to parent', fakeAsync(() => {
      service.assignEleveToParent(100, 200).subscribe();

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/users/100/assign-eleve',
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ eleveId: 200 });
      req.flush(null);

      tick();
    }));

    it('should remove eleve from parent', fakeAsync(() => {
      service.removeEleveFromParent(100, 200).subscribe();

      const req = httpMock.expectOne(
        'http://localhost:8080/api/v1/users/100/remove-eleve/200',
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      tick();
    }));
  });

  describe('clearCache', () => {
    it('should clear all cached data', fakeAsync(() => {
      // Setup some state
      service.getUsers().subscribe();
      const getReq = httpMock.expectOne(
        'http://localhost:8080/api/v1/users?page=0&size=10&sortBy=id&direction=ASC',
      );
      getReq.flush(mockPaginatedResponse);
      tick();

      service.getCurrentUser().subscribe();
      const meReq = httpMock.expectOne('http://localhost:8080/api/v1/users/me');
      meReq.flush(mockUser);
      tick();

      expect(service.users().length).toBe(3);
      expect(service.currentUser()).toBeTruthy();

      service.clearCache();

      expect(service.users()).toEqual([]);
      expect(service.currentUser()).toBeNull();
      expect(service.error()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    }));
  });
});
