import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://127.0.0.1:8000/v1/orders';

  constructor(private http: HttpClient) {}

  // Lấy tất cả đơn hàng của user hiện tại
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/my`);
  }

  // Lấy chi tiết đơn hàng của user
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  // Hủy đơn bằng id
  cancelOrder(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/cancel`, {});
  }

  // Hủy đơn bằng code (nếu dùng)
  cancelOrderByCode(orderId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/code/${orderId}/cancel`, {});
  }

createOrderWithMoMo(orderData: any): Observable<any> {
  const loginData = localStorage.getItem('login');
  let token = '';
  if (loginData) {
    const user = JSON.parse(loginData);
    token = user.accessToken;
  }

  return this.http.post(`${this.apiUrl}`, orderData, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Kiểm tra & giữ tồn kho trước khi thanh toán
checkStock(items: { variantId: string; quantity: number; name: string }[]): Observable<any> {
  const loginData = localStorage.getItem('login');
  const token = loginData ? JSON.parse(loginData).accessToken : '';
  return this.http.post(`${this.apiUrl}/check-stock`, { items }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Hoàn lại tồn kho khi thanh toán thất bại
releaseStock(items: { variantId: string; quantity: number }[]): Observable<any> {
  const loginData = localStorage.getItem('login');
  const token = loginData ? JSON.parse(loginData).accessToken : '';
  return this.http.post(`${this.apiUrl}/release-stock`, { items }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

}
