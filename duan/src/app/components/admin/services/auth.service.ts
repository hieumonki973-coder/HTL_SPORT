// Create new file: src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = 'https://backend-funsport-6e9i.onrender.com/v1/auth';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // Check if user has valid authentication token
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired (if you're using JWT)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      // If token parsing fails, consider it invalid
      return false;
    }
  }

  // Get current user from storage
  private getCurrentUserFromStorage(): User | null {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Login method
  login(credentials: { email: string; password: string }): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/login`, credentials).subscribe({
        next: (response) => {
          const { token, user } = response;
          this.setAuthData(token, user);
          this.isLoggedInSubject.next(true);
          this.currentUserSubject.next(user);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // Set authentication data
  private setAuthData(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Logout method
  logout(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Call backend logout endpoint (optional)
        this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
          next: () => {
            this.performLogout();
            resolve(true);
          },
          error: () => {
            // Even if backend logout fails, clear local data
            this.performLogout();
            resolve(true);
          }
        });
      } catch (error) {
        console.error('Error during logout:', error);
        this.performLogout();
        resolve(true);
      }
    });
  }

  // Perform actual logout
  private performLogout(): void {
    // Clear all authentication data
    this.clearAllAuthData();

    // Update observables
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);

    // Navigate to login page
    this.router.navigate(['/login']).catch(() => {
      // Fallback navigation
      window.location.href = '/login';
    });
  }

  // Clear all authentication data
  private clearAllAuthData(): void {
    const authKeys = [
      'authToken', 'user', 'userRole', 'refreshToken',
      'userPreferences', 'currentUser', 'sessionData',
      'loginTime', 'userSettings', 'accessToken', 'userData'
    ];

    // Clear localStorage
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Could not remove ${key} from localStorage:`, error);
      }
    });

    // Clear sessionStorage
    authKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Could not remove ${key} from sessionStorage:`, error);
      }
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Get authentication token
  getToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Refresh token (optional)
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<any>(`${this.apiUrl}/refresh-token`, { refreshToken });
  }

  // Auto logout when token expires
  autoLogout(): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration > 0) {
        setTimeout(() => {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          this.performLogout();
        }, timeUntilExpiration);
      }
    } catch (error) {
      console.error('Error parsing token for auto logout:', error);
    }
  }
}
