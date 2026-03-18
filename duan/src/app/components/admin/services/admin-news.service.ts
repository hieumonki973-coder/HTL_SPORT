import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface NewsItem {
  _id?: string;
  title: string;
  content?: string; // Made optional
  description?: string;
  image?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  author?: string;
  status?: 'draft' | 'published' | 'archived';
  viewCount?: number;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface NewsStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNewsService {
  private apiUrl = 'https://backend-funsport-6e9i.onrender.com/v1/news';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại sau.';
    console.error('AdminNewsService error:', error);

    if (error.status === 0) {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi client: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Dữ liệu không hợp lệ.';
          break;
        case 401:
          errorMessage = 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại.';
          this.clearAuthTokens();
          break;
        case 403:
          errorMessage = 'Không có quyền thực hiện thao tác này.';
          break;
        case 404:
          errorMessage = error.error?.message || 'Không tìm thấy tin tức.';
          break;
        case 409:
          errorMessage = error.error?.message || 'Tin tức đã tồn tại.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Dữ liệu không hợp lệ.';
          break;
        case 429:
          errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
          break;
        case 500:
          errorMessage = error.error?.message || 'Lỗi server nội bộ.';
          break;
        default:
          errorMessage = error.error?.message || `Lỗi ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  private clearAuthTokens(): void {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }

  getAllNews(): Observable<NewsItem[]> {
    console.log('Fetching all news');
    return this.http.get<NewsItem[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => response.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })),
      catchError(this.handleError.bind(this))
    );
  }

  getNewsById(id: string): Observable<NewsItem> {
    if (!this.isValidObjectId(id)) {
      return throwError(() => new Error('ID tin tức không hợp lệ'));
    }
    console.log(`Fetching news with ID: ${id}`);
    return this.http.get<NewsItem>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  searchNews(keyword: string): Observable<NewsItem[]> {
    if (!keyword?.trim()) {
      return this.getAllNews();
    }
    console.log(`Searching news with keyword: ${keyword}`);
    return this.http.get<NewsItem[]>(`${this.apiUrl}/search/${encodeURIComponent(keyword.trim())}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  addNews(newsData: Omit<NewsItem, '_id' | 'createdAt' | 'updatedAt'>): Observable<NewsItem> {
    const validationError = this.validateNewsData(newsData);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const payload = {
      title: newsData.title.trim(),
      content: newsData.content?.trim() || '',
      description: newsData.description?.trim() || '',
      image: newsData.image?.trim() || ''
    };

    console.log('Adding news with payload:', payload);
    return this.http.post<NewsItem>(this.apiUrl, payload, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  updateNews(id: string, newsData: Partial<NewsItem>): Observable<NewsItem> {
    if (!this.isValidObjectId(id)) {
      return throwError(() => new Error('ID tin tức không hợp lệ'));
    }

    const validationError = this.validateNewsData(newsData);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const payload: any = {};
    if (newsData.title !== undefined) payload.title = newsData.title.trim();
    if (newsData.content !== undefined) payload.content = newsData.content.trim();
    if (newsData.description !== undefined) payload.description = newsData.description.trim();
    if (newsData.image !== undefined) payload.image = newsData.image.trim();

    console.log(`Updating news with ID: ${id}, payload:`, payload);
    return this.http.patch<NewsItem>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deleteNews(id: string): Observable<{ message: string }> {
    if (!this.isValidObjectId(id)) {
      return throwError(() => new Error('ID tin tức không hợp lệ'));
    }

    console.log(`Deleting news with ID: ${id}`);
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deleteMultipleNews(ids: string[]): Observable<{ message: string; deletedCount: number }> {
    if (!ids || ids.length === 0) {
      return throwError(() => new Error('Danh sách ID không hợp lệ'));
    }

    for (const id of ids) {
      if (!this.isValidObjectId(id)) {
        return throwError(() => new Error(`ID không hợp lệ: ${id}`));
      }
    }

    console.log('Deleting multiple news with IDs:', ids);
    return this.http.delete<{ message: string; deletedCount: number }>(this.apiUrl, {
      headers: this.getHeaders(),
      body: { ids }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getNewsStats(): Observable<NewsStats> {
    console.log('Fetching news statistics');
    return this.http.get<NewsStats>(`${this.apiUrl}/admin/stats`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        total: response?.total || 0,
        thisMonth: response?.thisMonth || 0,
        thisWeek: response?.thisWeek || 0,
        today: response?.today || 0
      })),
      catchError(this.handleError.bind(this))
    );
  }

  private validateNewsData(newsData: Partial<NewsItem>): string | null {
    if (!newsData.title?.trim()) {
      return 'Tiêu đề không được để trống';
    }
    if (newsData.title.length > 200) {
      return 'Tiêu đề không được vượt quá 200 ký tự';
    }
    if (newsData.content && newsData.content.length > 10000) {
      return 'Nội dung không được vượt quá 10000 ký tự';
    }
    if (newsData.description && newsData.description.length > 300) {
      return 'Mô tả không được vượt quá 300 ký tự';
    }
    if (newsData.image && !this.isValidUrl(newsData.image)) {
      return 'URL hình ảnh không hợp lệ';
    }
    return null;
  }

  private isValidObjectId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    const isValid = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValid) {
      console.warn(`Invalid ObjectId format: ${id}`);
    }
    return isValid;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}
