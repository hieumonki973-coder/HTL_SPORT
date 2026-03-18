import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = 'http://127.0.0.1:8000/v1/news';

  constructor(private http: HttpClient) {}

  // Lấy tất cả tin tức
  getAllNews(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Lấy chi tiết tin tức theo ID
  getNewsById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  //lấy tin tức liên quan
    getRelatedNews(currentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/related/${currentId}`);
  }

}
