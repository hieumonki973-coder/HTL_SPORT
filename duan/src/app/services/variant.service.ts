import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Variant } from '../models/variant';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VariantService {
  private api = 'http://127.0.0.1:8000/v1/variant';

  constructor(private http: HttpClient) {}

  // 🔹 Lấy variant theo product
  getByProduct(productId: string): Observable<Variant[]> {
    return this.http.get<Variant[]>(`${this.api}/by-product/${productId}`);
  }

  // 🔹 Lấy chi tiết variant
  getById(id: string): Observable<Variant> {
    return this.http.get<Variant>(`${this.api}/${id}`);
  }

  // 🔹 Thêm variant
  create(data: Variant): Observable<Variant> {
    return this.http.post<Variant>(this.api, data);
  }

  // 🔹 Cập nhật variant
  update(id: string, data: Partial<Variant>): Observable<Variant> {
    return this.http.put<Variant>(`${this.api}/${id}`, data);
  }

  // 🔹 Xoá variant
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
