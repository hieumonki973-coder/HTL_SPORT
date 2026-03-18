import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = 'https://backend-funsport-6e9i.onrender.com/v1/user';

  constructor(private http: HttpClient) {}

  // ================= Helpers =================
  // headers cho JSON request
  private getJsonHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // headers cho FormData (không set Content-Type)
  private getFormHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // ================= User APIs =================
  // 👤 lấy thông tin user đang đăng nhập
  getUserInfo(): Observable<User> {
    return this.http.get<User>(`${this.api}/me`, {
      headers: this.getJsonHeaders(),
    });
  }

  // 📝 cập nhật profile (FormData)
  updateProfile(data: FormData): Observable<User> {
    return this.http.put<User>(`${this.api}/me`, data, {
      headers: this.getFormHeaders(),
    });
  }

  // 🔒 đổi mật khẩu
  changePassword(data: { oldPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(
      `${this.api}/me/password`,
      data,
      { headers: this.getJsonHeaders() }
    );
  }

  // 📝 cập nhật user theo id
  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, data, {
      headers: this.getJsonHeaders(),
    });
  }
}
