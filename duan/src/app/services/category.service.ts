import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../models/category';
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  url = `http://127.0.0.1:8000/v1`; // URL gốc của API

  constructor(private httpClient: HttpClient) { }

  // Phương thức lấy tất cả danh mục
 getAll(): Observable<Category[]> {
  return this.httpClient.get<Category[]>(`${this.url}/category`);
}
  delete(id: string) {
    return this.httpClient.delete(`${this.url}/category/${id}`);
  }

  addCategory(body: any) {
    return this.httpClient.post(`${this.url}/category`, body);
  }

  updateCategory(body:any, id: string) {
    return this.httpClient.put(`${this.url}/category/${id}`, body);
  }

  getCtegoryDetail(id: string) {
    return this.httpClient.get(`${this.url}/category/${id}`);
}
}
