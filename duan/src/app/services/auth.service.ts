import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly url = 'http://127.0.0.1:8000/v1';

  constructor(private http: HttpClient) {}

  /** Lấy thông tin user từ localStorage */
  private getUser(): any | null {
    const jsonData = localStorage.getItem('login');
    return jsonData ? JSON.parse(jsonData) : null;
  }

  /** Lấy userId từ localStorage */
  getUserId(): string | null {
    const user = this.getUser();
    return user ? user._id : null;   // ⚡ đảm bảo trả về _id
  }

  /** Kiểm tra có đăng nhập hay chưa */
  checkLogin(): any | false {
    return this.getUser() || false;
  }

  /** Kiểm tra có phải admin hay không */
  checkAdmin(): any | false {
    const user = this.getUser();
    return user?.admin === true ? user : false;
  }

  /** Trả về Observable<boolean> để check admin */
  isAdmin(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const user = this.getUser();
      observer.next(user?.admin === true);
      observer.complete();
    });
  }

  /** Đăng nhập */
  login(body: any): Observable<any> {
    return this.http.post(`${this.url}/account/login`, body);
  }

  /** Đăng ký */
  register(body: any): Observable<any> {
    return this.http.post(`${this.url}/account/add`, body);
  }
}
