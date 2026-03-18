import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../model-admin/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {

  private readonly apiUrl = 'http://127.0.0.1:8000/v1/admin/product';

  constructor(private http: HttpClient) {}

  /* ================= HEADER ================= */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /* ================= GET ALL ================= */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  /* ================= GET ONE ================= */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /* ================= CREATE ================= */
  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, {
      headers: this.getAuthHeaders(),
    });
  }

  /* ================= UPDATE ================= */
  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  /* ================= DELETE ONE ================= */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /* ================= DELETE MANY ================= */
  deleteMany(ids: string[]): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/delete-many`,
      { ids },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /* ================= EXPORT CSV ================= */
  exportCSV(): void {
    const token = localStorage.getItem('token');
    const url = `${this.apiUrl}/export/csv?token=${token}`;
    window.open(url, '_blank');
  }
}
