// orders.service.ts - Complete version with all interfaces and type definitions
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import {tap, catchError, retry } from 'rxjs/operators';

// Product interface (if not imported from Products.service)
export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string[];
  quantity: number;
  minStock: number;
  description?: string;
  brand?: string;
  weight?: number;
  dimensions?: string;
  material?: string;
  color?: string;
  inStock?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// User interface (if not imported from users.service)
export interface User {
  _id: string;
  name: string;
  email: string;
  status: string;
  spamCount: number;
  cancellationCount: number;
  ghostingCount: number;
  orderCount: number;
  returnCount: number;
  selected: boolean;
  phone?: string;
  address?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Main Order interface
export interface Order {
  _id?: string;   // <-- thêm dòng này

  orderId: string;
  cartItems: {
    name: string;
    price: number;
    quantity: number;
    productId?: string;
    image?: string;
    category?: string;
    brand?: string;
  }[];
  customerInfo: {
    fullName: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    district?: string;
    ward?: string;
    [key: string]: string | undefined;
  };
  amount: number;
  payment: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  selected?: boolean;

  // Additional fields for order management
  productId?: string | Product;
  userId?: string | User;
  totalAmount?: number;
  category?: string;
  productName?: string;
  customerName?: string;

  // Shipping and additional info
  shippingMethod?: string;
  shippingCost?: number;
  discount?: number;
  taxAmount?: number;
  notes?: string;

  // Order tracking
  orderNumber?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;

  // Payment info
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;

  // Internal fields
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
}

// Interface for order updates
export interface OrderUpdateRequest {
  customerInfo?: Partial<Order['customerInfo']>;
  cartItems?: Order['cartItems'];
  amount?: number;
  payment?: string;
  status?: string;
  shippingMethod?: string;
  shippingCost?: number;
  discount?: number;
  taxAmount?: number;
  notes?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  estimatedDelivery?: string;
  updatedAt?: string;
}

// Interface mở rộng cho dữ liệu export CSV / bảng
export interface OrderWithExtra extends Order {
  productName: string;
  customerName: string;
}

// Revenue and analytics interfaces
export interface RevenueByCategory {
  categoryName: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  percentageOfTotal: number;
}

export interface RevenueByDate {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  todayOrders: number;
  monthlyGrowth: number;
  revenueGrowth: number;
  orderGrowth: number;
}

// Filter interface for order queries
export interface OrderFilters {
  searchTerm?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  customerId?: string;
  productId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  customerName?: string;
  orderId?: string;
}

// API Response interfaces
export interface OrderResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',
  INPROGRESS = 'inprogress',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'return',
  LOCKED = 'locked'
}

// Payment method enum
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  E_WALLET = 'e_wallet',
  COD = 'cod'
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = 'https://backend-funsport-6e9i.onrender.com/v1/orders';

  constructor(private http: HttpClient) { }

  // Private method to get authentication headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Private method to handle HTTP errors
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    if (error.status === 0) {
      errorMessage = 'Không thể kết nối đến server';
    } else if (error.status === 401) {
      errorMessage = 'Không có quyền truy cập. Vui lòng đăng nhập lại';
      this.clearAuthTokens();
    } else if (error.status === 403) {
      errorMessage = 'Không có quyền truy cập tài nguyên này';
    } else if (error.status === 404) {
      errorMessage = 'Không tìm thấy dữ liệu';
    } else if (error.status === 429) {
      errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server nội bộ';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    console.error('OrderService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private clearAuthTokens(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
  }

  // Revenue and analytics methods
  getRevenueByCategory(): Observable<RevenueByCategory[]> {
    return this.http.get<RevenueByCategory[]>(`${this.apiUrl}/revenue-by-category`, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getRevenueByDate(startDate?: string, endDate?: string): Observable<RevenueByDate[]> {
    let url = `${this.apiUrl}/revenue-by-date`;
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<RevenueByDate[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getOrderStatistics(): Observable<OrderStatistics> {
    return this.http.get<OrderStatistics>(`${this.apiUrl}/statistics`, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Order CRUD operations
  getOrders(filters?: OrderFilters): Observable<Order[]> {
    let url = this.apiUrl;

    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return this.http.get<Order[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getOrdersPaginated(filters?: OrderFilters): Observable<OrderResponse> {
    let url = `${this.apiUrl}/paginated`;

    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return this.http.get<OrderResponse>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }
  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  createOrder(orderData: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

updateOrder(orderId: string, updateData: Partial<Order>): Observable<Order> {
  console.log('[OrderService] updateOrder CALLED');
  console.log('[OrderService] orderId:', orderId);
  console.log('[OrderService] updateData:', updateData);

  return this.http.put<Order>(`${this.apiUrl}/${orderId}`, updateData).pipe(
    tap((res: Order) => {   // 👈 thêm kiểu Order
      console.log('[OrderService] Response from API:', res);
    }),
    catchError((error) => {
      console.error('[OrderService] API error:', error);
      return throwError(() => error);
    })
  );
}

  partialUpdateOrder(orderId: string, data: Partial<OrderUpdateRequest>): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteOrder(orderId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${orderId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
  // Bulk operations
  bulkUpdateStatus(orderIds: string[], status: string): Observable<ApiResponse<any>> {
    const updateData = {
      orderIds,
      status,
      updatedAt: new Date().toISOString()
    };

    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/bulk/status`, updateData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  bulkDeleteOrders(orderIds: string[]): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/bulk`, {
      headers: this.getAuthHeaders(),
      body: { orderIds }
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Order locking for concurrent editing
  lockOrder(orderId: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/lock`, {
      lockedAt: new Date().toISOString()
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  unlockOrder(orderId: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/unlock`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  toggleOrderLock(orderId: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/toggle-lock`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Export functionality
  exportOrders(filters?: OrderFilters, format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Observable<Blob> {
    let url = `${this.apiUrl}/export`;
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    params.append('format', format);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getAuthHeaders().set(
        'Accept',
        format === 'csv' ? 'text/csv' :
          format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            'application/pdf'
      )
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Search and filtering helpers
  searchOrders(query: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/search`, {
      params: { q: query },
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOrdersByCustomer(customerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/customer/${customerId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOrdersByStatus(status: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/status/${status}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOrdersByDateRange(startDate: string, endDate: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/date-range`, {
      params: { startDate, endDate },
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Additional filtering methods
  getOrdersByProduct(productId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/product/${productId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOrdersByPaymentMethod(paymentMethod: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/payment/${paymentMethod}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Utility methods
  calculateOrderTotal(cartItems: Order['cartItems'], shippingCost = 0, discount = 0, taxRate = 0): number {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * taxRate;
    return subtotal + shippingCost + taxAmount - discount;
  }

  validateOrder(order: Partial<Order>): string[] {
    const errors: string[] = [];

    if (!order.customerInfo?.fullName?.trim()) {
      errors.push('Tên khách hàng là bắt buộc');
    }

    if (!order.customerInfo?.email?.trim()) {
      errors.push('Email khách hàng là bắt buộc');
    } else if (!this.isValidEmail(order.customerInfo.email)) {
      errors.push('Email không hợp lệ');
    }

    if (!order.customerInfo?.phone?.trim()) {
      errors.push('Số điện thoại khách hàng là bắt buộc');
    } else if (!this.isValidPhone(order.customerInfo.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    if (!order.cartItems || order.cartItems.length === 0) {
      errors.push('Đơn hàng phải có ít nhất một sản phẩm');
    }

    if (order.cartItems) {
      order.cartItems.forEach((item, index) => {
        if (!item.name?.trim()) {
          errors.push(`Sản phẩm ${index + 1}: Tên sản phẩm là bắt buộc`);
        }
        if (item.quantity <= 0) {
          errors.push(`Sản phẩm ${index + 1}: Số lượng phải lớn hơn 0`);
        }
        if (item.price < 0) {
          errors.push(`Sản phẩm ${index + 1}: Giá không thể âm`);
        }
      });
    }

    if (order.amount && order.amount < 0) {
      errors.push('Tổng tiền không thể âm');
    }

    return errors;
  }

  // Validation helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // Status translation utility
  translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ Xử Lý',
      'inprogress': 'Đang Xử Lý',
      'delivered': 'Đã Giao',
      'cancelled': 'Đã Hủy',
      'return': 'Trả Hàng',
      'locked': 'Bị Khóa'
    };
    return statusMap[status] || status;
  }

  // Payment method translation utility
  translatePaymentMethod(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cash': 'Tiền Mặt',
      'bank_transfer': 'Chuyển Khoản',
      'credit_card': 'Thẻ Tín Dụng',
      'e_wallet': 'Ví Điện Tử',
      'cod': 'Thanh Toán Khi Nhận Hàng'
    };
    return methodMap[method] || method;
  }

  // Date formatting utilities
  formatOrderDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Order tracking methods
  addTrackingNumber(orderId: string, trackingNumber: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/tracking`, {
      trackingNumber,
      updatedAt: new Date().toISOString()
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateEstimatedDelivery(orderId: string, estimatedDelivery: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/delivery`, {
      estimatedDelivery,
      updatedAt: new Date().toISOString()
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  markAsDelivered(orderId: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/delivered`, {
      status: OrderStatus.DELIVERED,
      deliveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Report generation methods
  generateOrderReport(filters?: OrderFilters, reportType: 'summary' | 'detailed' = 'summary'): Observable<Blob> {
    let url = `${this.apiUrl}/reports/${reportType}`;
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getAuthHeaders().set('Accept', 'application/pdf')
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Notification methods
  sendOrderNotification(orderId: string, notificationType: 'email' | 'sms' | 'both'): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${orderId}/notify`, {
      notificationType
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
}
