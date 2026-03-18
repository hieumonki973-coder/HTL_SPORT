import { Component, OnInit } from '@angular/core';
import { FavoriteService } from '../../../services/favorite.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss'],
  imports: [CommonModule],
})
export class FavoriteComponent implements OnInit {
  favorites: any[] = [];
  loading = false;

  constructor(private favoriteService: FavoriteService) { }

  ngOnInit(): void {
    this.favoriteService.favorites$.subscribe(favs => {
      this.favorites = favs.filter(f => f.productId && f.productId._id);
    });
    this.loadFavorites();
  }

  loadFavorites() {
    this.loading = true;
    this.favoriteService.getFavorites().subscribe({
      next: (res) => {
        this.favorites = res.filter(f => f.productId && f.productId._id);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  removeFavorite(favoriteId: string): void {
    this.favoriteService.removeFavorite(favoriteId).subscribe({
      next: () => {
        console.log("✔️ Đã xoá khỏi yêu thích");
        this.favorites = this.favorites.filter(f => f._id !== favoriteId);
      },
      error: (err) => console.error("❌ Lỗi khi xoá favorite:", err)
    });
  }
}
