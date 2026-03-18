import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Product {
  name: string;
  status: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'locked' | 'pending';
  orderCount: number;
  returnCount: number;
  phone?: string;
  address?: string;
  spamCount: number;
  cancellationCount: number;
  ghostingCount: number;
  products?: Product[];
  lockReason?: string | null;
  selected: boolean; // Made non-optional to satisfy type-checking
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  pendingUsers: number;
  totalViolations: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'https://backend-funsport-6e9i.onrender.com/v1/user';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      map(users => users.map(user => ({
        ...user,
        selected: user.selected ?? false,
        status: user.status ?? 'pending'
      }))),
      catchError(this.handleError)
    );
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
      map(user => ({
        ...user,
        selected: user.selected ?? false,
        status: user.status ?? 'pending'
      })),
      catchError(this.handleError)
    );
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  addUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      map(addedUser => ({
        ...addedUser,
        selected: addedUser.selected ?? false,
        status: addedUser.status ?? 'pending'
      })),
      catchError(this.handleError)
    );
    // Mock fallback if backend isn't ready:
    /*
    const newUser: User = {
      _id: 'USER' + (Math.random() * 1000).toString().padStart(3, '0'),
      name: user.name || 'Khách Hàng Mới',
      email: user.email || `newuser${Date.now()}@example.com`,
      status: user.status || 'pending',
      orderCount: user.orderCount || 0,
      returnCount: user.returnCount || 0,
      spamCount: user.spamCount || 0,
      cancellationCount: user.cancellationCount || 0,
      ghostingCount: user.ghostingCount || 0,
      phone: user.phone || 'N/A',
      address: user.address || 'N/A',
      products: user.products || [],
      selected: false
    };
    return of(newUser).pipe(delay(500));
    */
  }

  toggleLockUser(userId: string, lockReason: string | null): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/toggle-lock/${userId}`, { lockReason }).pipe(
      map(user => ({
        ...user,
        selected: user.selected ?? false,
        status: user.status ?? 'pending'
      })),
      catchError(this.handleError)
    );
  }

  toggleProductLock(userId: string, productId: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/toggle-product-lock/${userId}`, { productId }).pipe(
      map(user => ({
        ...user,
        selected: user.selected ?? false,
        status: user.status ?? 'pending'
      })),
      catchError(this.handleError)
    );
  }

  reportViolation(userId: string, violationType: 'spam' | 'cancellation' | 'ghosting'): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/report-violation/${userId}`, { violationType }).pipe(
      map(user => ({
        ...user,
        selected: user.selected ?? false,
        status: user.status ?? 'pending'
      })),
      catchError(this.handleError)
    );
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  deleteUsers(userIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk`, { userIds }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('UsersService: Error:', error.message, error.status, error.error);
    return throwError(() => new Error('Lỗi khi xử lý yêu cầu người dùng'));
  }
}
