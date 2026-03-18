import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Product } from '../../../models/product';
import { Category } from '../../../models/category';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { CartService } from '../../../services/cart.service';
import { FavoriteService } from '../../../services/favorite.service';

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class ProductComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  originalProducts: Product[] = [];
  categories: Category[] = [];
  availableSizes: { size: string; count: number }[] = [];

  selectedCategory = '';
  selectedSize = '';

  priceRangeMin = 0;
  priceRangeMax = 999999999;
  priceMin = 0;
  priceMax = 999999999;

  pageSize = 8;
  currentPage = 1;
  totalPagesArray: number[] = [];
  paginationDisplay: (number | string)[] = [];
  totalPages = 0;
  jumpToPageInput = '';


  selectedParentCategory = '';
  selectedChildCategory = '';
  private subscriptions = new Subscription();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private favoriteService: FavoriteService
  ) { }

  /* ================= LIFE CYCLE ================= */
  ngOnInit(): void {
    this.loadCategoriesAndProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /* ================= ICON ACTIONS ================= */
  addToCart(product: Product): void {
    const variant =
      (product.bienthe || []).find((v: any) => v.soluong > 0) ||
      (product.bienthe || [])[0];

    if (!variant) {
      alert('❌ Không có biến thể để thêm vào giỏ');
      return;
    }

    this.cartService
      .addToCart({
        id_sanpham: product._id,
        id_bienthe: variant._id,
        soluong: 1,
      })
      .subscribe({
        next: (res) => {
          alert('✅ Đã thêm vào giỏ hàng');
          this.cartService.updateCartCount(res);
        },
        error: (err) => {
          console.error('❌ Add cart error', err);
          alert('❌ Thêm vào giỏ hàng thất bại');
        },
      });
  }

  toggleFavorite(product: Product): void {
    this.favoriteService.toggleFavorite(product);
  }

  /* ================= LOAD DATA ================= */
  private loadCategoriesAndProducts(): void {
    this.subscriptions.add(
      this.categoryService.getAll().subscribe({
        next: (categories: Category[]) => {
          this.categories = categories || [];
          this.loadProducts();
        },
        error: () => {
          this.categories = [];
          this.loadProducts();
        }
      })
    );
  }
  private loadProducts(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe((params) => {
        const keyword = params['keyword'] || '';
        const category = params['category'] || '';
        let danhmuc = params['danhmuc'] || '';

        // nếu category và danhmuc giống nhau thì coi như đang chọn danh mục cha
        if (category && danhmuc && String(category) === String(danhmuc)) {
          danhmuc = '';
        }

        this.selectedParentCategory = category;
        this.selectedChildCategory = danhmuc;
        this.selectedCategory = danhmuc || category;

        this.productService.getAll({ keyword }).subscribe({
          next: (products: Product[]) => {
            this.originalProducts = products || [];
            this.calculatePriceRange();
            this.applyFilterAndPagination(true);
          },
          error: (err) => {
            console.error('❌ loadProducts error:', err);
            this.originalProducts = [];
            this.calculatePriceRange();
            this.applyFilterAndPagination(true);
          },
        });
      })
    );
  }
  /* ================= PRICE CALCULATION ================= */
  private calculatePriceRange(): void {
    if (this.originalProducts.length === 0) {
      this.priceMin = 0;
      this.priceMax = 999999999;
      this.priceRangeMin = this.priceMin;
      this.priceRangeMax = this.priceMax;
      return;
    }

    let minPrice = Infinity;
    let maxPrice = 0;

    this.originalProducts.forEach((product) => {
      if (Array.isArray(product.bienthe)) {
        product.bienthe.forEach((variant: any) => {
          if (variant.giagoc != null) {
            minPrice = Math.min(minPrice, variant.giagoc);
            maxPrice = Math.max(maxPrice, variant.giagoc);
          }
        });
      }
    });

    this.priceMin = minPrice === Infinity ? 0 : minPrice;
    this.priceMax = maxPrice === 0 ? 999999999 : maxPrice;

    this.priceRangeMin = this.priceMin;
    this.priceRangeMax = this.priceMax;
  }

  /* ================= FILTER ================= */
  filterProducts(): void {
    this.applyFilterAndPagination(true);
  }

  toggleCategory(categoryId: string): void {
    const clickedId = String(categoryId || '');

    // nếu đang click lại đúng danh mục đang chọn -> bỏ lọc hết
    if (
      clickedId &&
      (clickedId === this.selectedChildCategory || clickedId === this.selectedParentCategory)
    ) {
      this.selectedCategory = '';
      this.selectedParentCategory = '';
      this.selectedChildCategory = '';

      this.router.navigate(['/product'], {
        queryParams: {
          category: null,
          danhmuc: null
        }
      });
      return;
    }

    const clickedCategory = (this.categories as any[]).find(
      (c: any) => this.normalizeCategoryId(c?._id) === clickedId
    );

    const parentId = this.normalizeCategoryId(clickedCategory?.parentId);

    // ===== click danh mục con =====
    if (parentId) {
      this.selectedCategory = clickedId;
      this.selectedParentCategory = parentId;
      this.selectedChildCategory = clickedId;

      this.router.navigate(['/product'], {
        queryParams: {
          category: parentId,
          danhmuc: clickedId
        }
      });
      return;
    }

    // ===== click danh mục cha =====
    this.selectedCategory = clickedId;
    this.selectedParentCategory = clickedId;
    this.selectedChildCategory = '';

    this.router.navigate(['/product'], {
      queryParams: {
        category: clickedId,
        danhmuc: null
      }
    });
  }

  toggleSize(size: string): void {
    this.selectedSize = this.selectedSize === size ? '' : size;
    this.filterProducts();
  }

  clearPriceFilter(): void {
    this.priceRangeMin = this.priceMin;
    this.priceRangeMax = this.priceMax;
    this.filterProducts();
  }

  clearMinFilter(): void {
    this.priceRangeMin = this.priceMin;
    this.filterProducts();
  }

  clearMaxFilter(): void {
    this.priceRangeMax = this.priceMax;
    this.filterProducts();
  }

  clearSizeFilter(): void {
    this.selectedSize = '';
    this.filterProducts();
  }

  isPriceFiltered(): boolean {
    return this.priceRangeMin > this.priceMin || this.priceRangeMax < this.priceMax;
  }

  onSliderTrackClick(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    const value = Math.round(this.priceMin + percentage * (this.priceMax - this.priceMin));

    if (Math.abs(value - this.priceRangeMin) < Math.abs(value - this.priceRangeMax)) {
      this.priceRangeMin = Math.min(value, this.priceRangeMax);
    } else {
      this.priceRangeMax = Math.max(value, this.priceRangeMin);
    }

    this.filterProducts();
  }

  private updateAvailableSizes(): void {
    const sizeCounts = new Map<string, number>();

    this.products.forEach((product) => {
      if (Array.isArray(product.bienthe)) {
        product.bienthe.forEach((variant: any) => {
          if (variant.size) {
            sizeCounts.set(variant.size, (sizeCounts.get(variant.size) || 0) + 1);
          }
        });
      }
    });

    this.availableSizes = Array.from(sizeCounts.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => {
        const sizeOrder = { S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
        const aOrder = sizeOrder[a.size as keyof typeof sizeOrder] || 999;
        const bOrder = sizeOrder[b.size as keyof typeof sizeOrder] || 999;
        return aOrder - bOrder;
      });
  }

  private applyFilterAndPagination(resetPage = false): void {
    let filtered: Product[] = [...this.originalProducts];

    // ✅ LỌC THEO CATEGORY / CHA-CON
    // ✅ LỌC THEO CATEGORY / CHA-CON
    if (this.selectedChildCategory) {
      // có danh mục con -> lọc đúng danh mục con
      filtered = filtered.filter((p: any) => {
        const categoryId = this.normalizeCategoryId(p?.categoryId);
        return categoryId === String(this.selectedChildCategory);
      });
    } else if (this.selectedParentCategory) {
      // chỉ có danh mục cha -> lấy tất cả danh mục con của cha
      const validCategoryIds = this.getSelectedAndChildCategoryIds(this.selectedParentCategory);

      filtered = filtered.filter((p: any) => {
        const categoryId = this.normalizeCategoryId(p?.categoryId);
        return validCategoryIds.includes(categoryId);
      });
    }

    // ✅ LỌC THEO GIÁ
    filtered = filtered.filter(
      (p: Product) =>
        Array.isArray(p.bienthe) &&
        p.bienthe.some(
          (v: any) => v.giagoc >= this.priceRangeMin && v.giagoc <= this.priceRangeMax
        )
    );

    // ✅ LỌC THEO KÍCH THƯỚC
    if (this.selectedSize) {
      filtered = filtered.filter(
        (p: Product) =>
          Array.isArray(p.bienthe) &&
          p.bienthe.some((v: any) => v.size === this.selectedSize)
      );
    }

    this.products = filtered;
    this.updateAvailableSizes();

    this.totalPages = Math.ceil(this.products.length / this.pageSize);
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    if (resetPage) {
      this.currentPage = 1;
      this.jumpToPageInput = '';
    } else if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.generatePaginationDisplay();
  }

  private getSelectedAndChildCategoryIds(categoryId: string): string[] {
    const selectedId = String(categoryId);

    const childIds = (this.categories as any[])
      .filter((c: any) => this.normalizeCategoryId(c?.parentId) === selectedId)
      .map((c: any) => this.normalizeCategoryId(c?._id))
      .filter(Boolean);

    return [selectedId, ...childIds];
  }

  private normalizeCategoryId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value?._id) return String(value._id);
    if (value?.$oid) return String(value.$oid);
    return String(value);
  }

  /* ================= PAGINATION ================= */
  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  goToPage(page: number | string): void {
    if (typeof page === 'string') return;

    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.jumpToPageInput = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.generatePaginationDisplay();
    }
  }

  private generatePaginationDisplay(): void {
    const total = this.totalPages;
    const current = this.currentPage;
    this.paginationDisplay = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        this.paginationDisplay.push(i);
      }
      return;
    }

    const delta = 2;
    const left = Math.max(1, current - delta);
    const right = Math.min(total, current + delta);
    const range: number[] = [];

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (left > 1) {
      this.paginationDisplay.push(1);
      if (left > 2) this.paginationDisplay.push('...');
    }

    for (const p of range) {
      this.paginationDisplay.push(p);
    }

    if (right < total) {
      if (right < total - 1) this.paginationDisplay.push('...');
      this.paginationDisplay.push(total);
    }
  }

  jumpToPage(): void {
    const page = parseInt(this.jumpToPageInput, 10);

    if (isNaN(page)) {
      alert('Vui lòng nhập số trang hợp lệ');
      return;
    }

    if (page >= 1 && page <= this.totalPages) {
      this.goToPage(page);
    } else {
      alert(`Trang phải từ 1 đến ${this.totalPages}`);
    }
  }

  getPaginationClass(item: number | string): string {
    if (typeof item === 'string') {
      return 'pagination-ellipsis';
    }
    return item === this.currentPage ? 'active' : '';
  }

  /* ================= VIEW ================= */
  viewDetail(product: Product): void {
    this.router.navigate(['/product-detail', product._id]);
  }

  hasInStock(product: Product): boolean {
    return (
      Array.isArray(product.bienthe) &&
      product.bienthe.length > 0 &&
      product.bienthe.some((v: any) => v.soluong > 0)
    );
  }

  /* ================= PRICE ================= */
  getPriceRange(product: Product): string {
    if (!product.bienthe || !product.bienthe.length) {
      return 'Liên hệ';
    }

    const prices = product.bienthe.map((v: any) => v.giagoc);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return min === max
      ? `${min.toLocaleString()}₫`
      : `${min.toLocaleString()}₫ - ${max.toLocaleString()}₫`;
  }

  /* ================= PRICE FORMAT ================= */
  formatPrice(price: number): string {
    if (price >= 1000000) {
      return (
        (price / 1000000).toLocaleString('vi-VN', {
          maximumFractionDigits: 1,
        }) + 'M'
      );
    }

    if (price >= 1000) {
      return (
        (price / 1000).toLocaleString('vi-VN', {
          maximumFractionDigits: 0,
        }) + 'K'
      );
    }

    return price.toLocaleString('vi-VN');
  }

  formatPriceDisplay(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}
