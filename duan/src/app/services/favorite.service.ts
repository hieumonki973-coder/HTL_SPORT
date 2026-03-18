import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Favorite } from '../models/favorite';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private apiUrl = 'http://127.0.0.1:8000/v1/favorites';

  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
/** 🔹 Load favorites từ server khi khởi động app */
loadFavorites(): void {
  this.getFavorites().subscribe({
    next: (favs) => this.setFavorites(favs),
    error: (err) => {
      console.error('❌ Lỗi khi load favorites:', err);
      this.setFavorites([]); // reset nếu lỗi
    }
  });
}

  /** 🔹 GET favorites */
  getFavorites(): Observable<Favorite[]> {
    return this.http
      .get<Favorite[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(tap((favs) => this.setFavorites(favs)));
  }

  /** 🔹 SET favorites */
  setFavorites(favs: Favorite[]): void {
    this.favoritesSubject.next(favs);
  }

  /** 🔹 ADD favorite */
  addFavorite(product: any): Observable<Favorite> {
    const body = { productId: product._id };

    return this.http
      .post<Favorite>(this.apiUrl, body, { headers: this.getAuthHeaders() })
      .pipe(
        tap((newFav: Favorite) => {
          const current = this.favoritesSubject.value;
          this.favoritesSubject.next([...current, newFav]);
          alert('✅ Đã thêm vào yêu thích');
        })
      );
  }

  /** 🔹 REMOVE favorite */
  removeFavorite(favoriteId: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${favoriteId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          const updated = this.favoritesSubject.value.filter(
            (f) => f._id !== favoriteId
          );
          this.favoritesSubject.next(updated);
          alert('❌ Đã xoá khỏi yêu thích');
        })
      );
  }

  /** 🔹 TOGGLE favorite */
  toggleFavorite(product: any): void {
    const current = this.favoritesSubject.value;
    const exists = current.some((f) => f.productId._id === product._id);

    if (exists) {
      alert('⚠️ Sản phẩm đã có trong yêu thích');
    } else {
      this.addFavorite(product).subscribe();
    }
  }

  /** 🔹 Lấy favorites hiện tại */
  getFavoritesValue(): Favorite[] {
    return this.favoritesSubject.value;
  }

  /** 🔹 CHECK favorite */
  isFavorite(productId: string): boolean {
    return this.favoritesSubject.value.some(
      (f) => f.productId._id === productId
    );
  }
}
