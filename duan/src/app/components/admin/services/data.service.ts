import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
// TODO: Replace with actual import if 'Order' is exported from order.service
export interface Order {
  id: number;
  // Add other properties as needed
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:8000/v1';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Dữ liệu không hợp lệ';
          break;
        case 401:
          errorMessage = 'Không có quyền truy cập';
          break;
        case 403:
          errorMessage = 'Bị từ chối truy cập';
          break;
        case 404:
          errorMessage = 'Không tìm thấy dữ liệu';
          break;
        case 500:
          errorMessage = 'Lỗi máy chủ nội bộ';
          break;
        default:
          errorMessage = `Lỗi ${error.status}: ${error.message}`;
      }
    }
    console.error('DataService Error:', error);
    return throwError(() => ({ status: error.status, message: errorMessage, details: error }));
  }

  getRecentOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/recent`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getChartData(): Observable<{ series: any[]; categories: string[] }> {
    return this.http.get<{ series: any[]; categories: string[] }>(`${this.apiUrl}/stats`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
