import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private API = 'http://127.0.0.1:8000/v1/cart';

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  private checkoutCart: CartItem[] = [];
  private LOCAL_CART_KEY = 'local_cart';

  constructor(private http: HttpClient) {
    this.loadCartCount();
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      })
    };
  }

  private isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  /* =========================================================
     LOCAL CART
  ========================================================= */

  getLocalCart(): any[] {
    const raw = localStorage.getItem(this.LOCAL_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  saveLocalCart(items: any[]): void {
    localStorage.setItem(this.LOCAL_CART_KEY, JSON.stringify(items));
    this.updateCartCount(items);
  }

  addToLocalCart(data: {
    id_sanpham: string;
    id_bienthe: string | null;
    soluong: number;
    ten?: string;
    gia?: number;
    hinh?: string;
    selectedSize?: string;
    selectedColor?: string;
  }): void {
    const cart = this.getLocalCart();

    const index = cart.findIndex(item =>
      item.id_sanpham === data.id_sanpham &&
      item.id_bienthe === data.id_bienthe
    );

    if (index !== -1) {
      cart[index].soluong += data.soluong;
    } else {
      cart.push({
        ...data
      });
    }

    this.saveLocalCart(cart);
  }

  removeFromLocalCart(id_bienthe: string): void {
    const cart = this.getLocalCart().filter(item => item.id_bienthe !== id_bienthe);
    this.saveLocalCart(cart);
  }

  increaseLocalQuantity(id_bienthe: string): void {
    const cart = this.getLocalCart();
    const item = cart.find(x => x.id_bienthe === id_bienthe);
    if (item) {
      item.soluong += 1;
      this.saveLocalCart(cart);
    }
  }

  decreaseLocalQuantity(id_bienthe: string): void {
    const cart = this.getLocalCart();
    const item = cart.find(x => x.id_bienthe === id_bienthe);

    if (item) {
      item.soluong -= 1;
      if (item.soluong <= 0) {
        const newCart = cart.filter(x => x.id_bienthe !== id_bienthe);
        this.saveLocalCart(newCart);
      } else {
        this.saveLocalCart(cart);
      }
    }
  }

  updateLocalQuantity(id_bienthe: string, soluong: number): void {
    const cart = this.getLocalCart();
    const item = cart.find(x => x.id_bienthe === id_bienthe);

    if (item) {
      item.soluong = soluong > 0 ? soluong : 1;
      this.saveLocalCart(cart);
    }
  }

  clearLocalCart(): void {
    localStorage.removeItem(this.LOCAL_CART_KEY);
    this.cartCountSubject.next(0);
  }

  /* =========================================================
     GET CART
  ========================================================= */

  getCart(): Observable<{
    success: boolean;
    total?: number;
    items: any[];
    message?: string;
  }> {
    if (!this.isLoggedIn()) {
      const localItems = this.getLocalCart();
      return of({
        success: true,
        total: localItems.length,
        items: localItems,
        message: 'Giỏ hàng local'
      });
    }

    return this.http.get<{
      success: boolean;
      total?: number;
      items: any[];
      message?: string;
    }>(`${this.API}`, this.getHeaders()).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Lấy giỏ hàng thất bại');
        }
        return response;
      }),
      catchError(err => {
        console.error('Lỗi khi lấy giỏ hàng:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     ADD TO CART
  ========================================================= */

  addToCart(data: {
    id_sanpham: string;
    id_bienthe: string | null;
    soluong: number;
    ten?: string;
    gia?: number;
    hinh?: string;
    selectedSize?: string;
    selectedColor?: string;
  }): Observable<{ success: boolean; message: string; items?: CartItem[] }> {
    if (!this.isLoggedIn()) {
      this.addToLocalCart(data);
      return of({
        success: true,
        message: 'Đã thêm vào giỏ hàng tạm'
      });
    }

    return this.http.post<any>(`${this.API}/add`, data, this.getHeaders()).pipe(
      map(res => {
        this.loadCartCount();
        return res;
      }),
      catchError(err => {
        console.error('Lỗi thêm vào giỏ:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     REMOVE
  ========================================================= */

  removeFromCart(id_bienthe: string): Observable<{ success: boolean; message: string; items: CartItem[] }> {
    if (!this.isLoggedIn()) {
      this.removeFromLocalCart(id_bienthe);
      return of({
        success: true,
        message: 'Đã xóa sản phẩm khỏi giỏ hàng tạm',
        items: this.getLocalCart()
      } as any);
    }

    return this.http.delete<any>(`${this.API}/remove/${id_bienthe}`, this.getHeaders()).pipe(
      map(res => {
        this.loadCartCount();
        return res;
      }),
      catchError(err => {
        console.error('Lỗi xóa sản phẩm:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     DECREASE
  ========================================================= */

  decreaseQuantity(id_bienthe: string): Observable<{ success: boolean; message: string; items: CartItem[] }> {
    if (!this.isLoggedIn()) {
      this.decreaseLocalQuantity(id_bienthe);
      return of({
        success: true,
        message: 'Đã giảm số lượng',
        items: this.getLocalCart()
      } as any);
    }

    return this.http.put<any>(`${this.API}/decrease/${id_bienthe}`, {}, this.getHeaders()).pipe(
      map(res => {
        this.loadCartCount();
        return res;
      }),
      catchError(err => {
        console.error('Lỗi giảm số lượng:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     INCREASE
  ========================================================= */

  increaseQuantity(id_bienthe: string): Observable<{ success: boolean; message: string; items: CartItem[] }> {
    if (!this.isLoggedIn()) {
      this.increaseLocalQuantity(id_bienthe);
      return of({
        success: true,
        message: 'Đã tăng số lượng',
        items: this.getLocalCart()
      } as any);
    }

    return this.http.put<any>(`${this.API}/increase/${id_bienthe}`, {}, this.getHeaders()).pipe(
      map(res => {
        this.loadCartCount();
        return res;
      }),
      catchError(err => {
        console.error('Lỗi tăng số lượng:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     UPDATE
  ========================================================= */

  updateQuantity(id_bienthe: string, soluong: number): Observable<{ success: boolean; message: string; items: CartItem[] }> {
    if (!this.isLoggedIn()) {
      this.updateLocalQuantity(id_bienthe, soluong);
      return of({
        success: true,
        message: 'Đã cập nhật số lượng',
        items: this.getLocalCart()
      } as any);
    }

    return this.http.put<any>(`${this.API}/update/${id_bienthe}`, { soluong }, this.getHeaders()).pipe(
      map(res => {
        this.loadCartCount();
        return res;
      }),
      catchError(err => {
        console.error('Lỗi cập nhật số lượng:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     REMOVE MULTIPLE
  ========================================================= */

  removeMultiple(variantIds: string[]): Observable<{ success: boolean; message: string; items: CartItem[] }> {
    if (!this.isLoggedIn()) {
      const cart = this.getLocalCart().filter(item => !variantIds.includes(item.id_bienthe));
      this.saveLocalCart(cart);

      return of({
        success: true,
        message: 'Đã xóa các sản phẩm đã chọn',
        items: cart
      } as any);
    }

    return this.http.post<any>(`${this.API}/remove-multiple`, { variantIds }, this.getHeaders()).pipe(
      map(res => {
        this.loadCartCount();
        return res;
      }),
      catchError(err => {
        console.error('Lỗi xóa nhiều sản phẩm:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     CLEAR CART
  ========================================================= */

  clearCart(): Observable<any> {
    if (!this.isLoggedIn()) {
      this.clearLocalCart();
      return of({
        success: true,
        message: 'Đã xóa toàn bộ giỏ hàng tạm'
      });
    }

    return this.http.delete(`${this.API}/clear`, this.getHeaders()).pipe(
      map(res => {
        this.loadCartCount();
        return res;
      }),
      catchError(err => {
        console.error('Lỗi xóa toàn bộ giỏ:', err);
        return throwError(() => err);
      })
    );
  }

  /* =========================================================
     CART COUNT
  ========================================================= */

  updateCartCount(items: any[] | { items?: any[] }): void {
    const cartItems = Array.isArray(items) ? items : (items?.items || []);

    const totalProducts = cartItems.reduce((sum: number, item: any) => {
      return sum + (item.soluong || item.quantity || 1);
    }, 0);

    this.cartCountSubject.next(totalProducts);
  }

  loadCartCount(): void {
    if (!this.isLoggedIn()) {
      const localItems = this.getLocalCart();
      this.updateCartCount(localItems);
      return;
    }

    this.getCart().subscribe({
      next: (res) => this.updateCartCount(res.items || []),
      error: () => this.cartCountSubject.next(0)
    });
  }

  /* =========================================================
     CHECKOUT TEMP
  ========================================================= */

  setCheckoutCart(items: CartItem[]): void {
    this.checkoutCart = items;
  }

  getCheckoutCart(): CartItem[] {
    return this.checkoutCart;
  }

  clearCheckoutCart(): void {
    this.checkoutCart = [];
  }

  /* =========================================================
     SYNC LOCAL CART TO SERVER AFTER LOGIN
  ========================================================= */

  syncLocalCartToServer(): void {
    if (!this.isLoggedIn()) return;

    const localItems = this.getLocalCart();
    if (!localItems.length) return;

    localItems.forEach(item => {
      const payload = {
        id_sanpham: item.id_sanpham,
        id_bienthe: item.id_bienthe,
        soluong: item.soluong
      };

      this.http.post<any>(`${this.API}/add`, payload, this.getHeaders()).subscribe({
        next: () => {},
        error: err => console.error('Lỗi sync local cart:', err)
      });
    });

    this.clearLocalCart();
    this.loadCartCount();
  }
}
