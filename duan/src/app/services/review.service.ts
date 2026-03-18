// services/review.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = 'http://127.0.0.1:8000/v1';

  constructor(private http: HttpClient) {}

  getByProduct(productId: string) {
    return this.http.get<any>(`${this.api}/reviews/${productId}`);
  }

 add(productId: string, data: { rating: number; comment: string }) {
  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    `${this.api}/reviews/${productId}`,
    data,
    { headers }
  );
}
}
