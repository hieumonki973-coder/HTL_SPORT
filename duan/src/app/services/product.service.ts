import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private url = 'http://127.0.0.1:8000/v1/product';

  constructor(private http: HttpClient) {}

  /* ================= GET ALL ================= */
  getAll(params?: {
    keyword?: string;
    category?: string;
    danhmuc?: string;
  }): Observable<Product[]> {
    const query: any = { ...(params || {}) };

    // Nếu backend của bạn đang lọc theo "category"
    // thì map danhmuc -> category để không cần sửa backend ngay
    if (query.danhmuc) {
      query.category = query.danhmuc;
      delete query.danhmuc;
    }

    return this.http
      .get<{ products: Product[]; total: number }>(this.url, { params: query })
      .pipe(
        map(res => res.products),
        catchError(this.handleError)
      );
  }

  /* ================= SALE ================= */
  getSaleProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>(`${this.url}/sale`)
      .pipe(catchError(this.handleError));
  }

  /* ================= GET DETAIL ================= */
  getById(id: string): Observable<Product> {
    return this.http
      .get<Product>(`${this.url}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getRelatedByten_loai(ten_loai: string): Observable<Product[]> {
    const url = `${this.url}/related/${ten_loai}`;
    console.log('🌐 CALL API:', url);

    return this.http
      .get<Product[]>(url)
      .pipe(catchError(this.handleError));
  }

  getByBrand(slug: string): Observable<any> {
    return this.http
      .get<any>(`${this.url}/brand/${slug}`)
      .pipe(catchError(this.handleError));
  }

  /* ================= ADD ================= */
  addProduct(data: FormData): Observable<Product> {
    return this.http
      .post<Product>(this.url, data)
      .pipe(catchError(this.handleError));
  }

  /* ================= UPDATE ================= */
  updateProduct(id: string, data: FormData): Observable<Product> {
    return this.http
      .put<Product>(`${this.url}/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  /* ================= DELETE ================= */
  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.url}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /* ================= RANDOM ================= */
  getRandom(limit = 10): Observable<Product[]> {
    return this.http
      .get<Product[]>(`${this.url}/random?limit=${limit}`)
      .pipe(catchError(this.handleError));
  }

  /* ================= STATS ================= */
  getStats(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/stats`)
      .pipe(catchError(this.handleError));
  }

  /* ================= RELATED ================= */
  getRelated(productId: string): Observable<Product[]> {
    return this.http
      .get<{ products: Product[] }>(`${this.url}/related/${productId}`)
      .pipe(
        map(res => res.products),
        catchError(this.handleError)
      );
  }

  /* ================= FEATURED ================= */
  getFeaturedProducts(): Observable<Product[]> {
    return this.http
      .get<{ success: boolean; total: number; data: Product[] }>(`${this.url}/featured`)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /* ================= ERROR ================= */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ API Error:', error);
    return throwError(() => error);
  }
}
