import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';

import { Product, ProductImage } from '../../../models/product';
import { Variant } from '../../../models/variant';
import { ReviewService } from '../../../services/review.service';
import { ReviewComponent } from '../review/review.component';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,  ReviewComponent ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})



export class ProductDetailComponent implements OnInit {

  /* ================= DATA ================= */
  product!: Product;
  variants: Variant[] = [];
  selectedVariant: Variant | null = null;
  relatedProducts: Product[] = [];

  /* ================= IMAGE ================= */
  selectedImage = '';
  filteredImages: ProductImage[] = [];

  displayPrice: number | null = null;
  priceRange: { min: number; max: number } | null = null;

  /* ================= OPTIONS ================= */
  colors: { name: string; code: string }[] = [];
  sizes: string[] = [];

  selectedColor: string | null = null;
  selectedSize: string | null = null;

  /* ================= PRICE ================= */
  minPrice = 0;
  maxPrice = 0;

  /* ================= STATE ================= */
  quantity = 1;
  maxQuantity = 0;
  quantityError = '';
  outOfStock = false;

  /* ================= RATING ================= */
  avgRating = 0;
  totalReview = 0;

  /* ================= TAB ================= */
  activeTab: 'desc' | 'review' | 'policy' | 'size' = 'desc';

  constructor(

    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private ReviewService: ReviewService,

  ) { }

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadProduct(id);
    });
  }

  /* ================= LOAD PRODUCT ================= */
  loadProduct(id: string): void {
    console.log('🟡 loadProduct ID:', id);

    this.productService.getById(id).subscribe({
      next: (res: Product) => {
        console.log('🟢 PRODUCT DETAIL RESPONSE:', res);

        this.product = res;

        this.variants = res.bienthe || [];

        this.filteredImages = res.hinh || [];
        if (this.filteredImages.length) {
          this.selectedImage = this.filteredImages[0].url;
        }

        this.prepareOptions();
        this.calcPrice();
        this.setInitialPrice();

        this.outOfStock = this.variants.every(v => v.soluong <= 0);

        // 🔥 Load reviews để tính rating
        this.loadRating(id);

        // 🔥 LOG SLUG
        console.log('🟣 PRODUCT SLUG:', res.slug);
      },
      error: err => {
        console.error('❌ getById ERROR:', err);
      }
    });
  }


  loadRating(productId: string): void {
    this.ReviewService.getByProduct(productId).subscribe({
      next: (response: any) => {
        console.log('🟢 REVIEWS RESPONSE:', response);

        // Giả sử response có cấu trúc { reviews: [...] } hoặc trực tiếp là array
        const reviews = response.reviews || response || [];

        if (reviews && reviews.length > 0) {
          this.totalReview = reviews.length;
          const totalRating = reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
          this.avgRating = totalRating / reviews.length;
        } else {
          this.avgRating = 0;
          this.totalReview = 0;
        }
      },
      error: err => {
        console.error('❌ LOAD RATING ERROR:', err);
        this.avgRating = 0;
        this.totalReview = 0;
      }
    });
  }

  setInitialPrice(): void {
    const prices = this.variants.map(v => v.giagoc);
    this.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
    this.displayPrice = null;
  }
  /* ================= SELECT VARIANT ================= */
  selectVariant(variant: Variant): void {
    this.selectedVariant = variant;
    this.selectedColor = variant.color;
    this.selectedSize = variant.size;

    this.displayPrice = variant.giagoc; // ✅ QUAN TRỌNG
    this.priceRange = null;             // ✅

    this.outOfStock = variant.soluong <= 0;
    this.maxQuantity = variant.soluong;
    this.quantity = 1;
    this.quantityError = '';
  }
  selectColor(color: string): void {
    this.selectedColor = color;
    this.selectedSize = null;
    this.selectedVariant = null;

    // 1️⃣ lấy variants theo màu
    const variantsByColor = this.variants.filter(v => v.color === color);

    // 2️⃣ xử lý price range
    const prices = variantsByColor.map(v => v.giagoc);
    this.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
    this.displayPrice = null;

    // 3️⃣ tìm variant đầu tiên của màu đó
    const firstVariant = variantsByColor[0];
    if (!firstVariant) return;

    // 4️⃣ tìm ảnh theo id_bienthe
    const image = this.filteredImages.find(img => {
      if (!img.id_bienthe) return false;

      const id =
        typeof img.id_bienthe === 'string'
          ? img.id_bienthe
          : img.id_bienthe._id;

      return id === firstVariant._id;
    });

    // 5️⃣ đổi ảnh chính
    if (image) {
      this.selectedImage = image.url;
    }
  }
  getVariantByImage(img: any): Variant | undefined {
    if (!img.id_bienthe) return undefined;

    const id =
      typeof img.id_bienthe === 'string'
        ? img.id_bienthe
        : img.id_bienthe._id;

    return this.variants.find(v => v._id === id);
  }
  selectSize(size: string): void {
    console.log('📏 SELECT SIZE:', size);

    this.selectedSize = size;

    const variant = this.variants.find(
      v => v.color === this.selectedColor && v.size === size
    );

    if (variant) {
      this.selectVariant(variant);
    } else {
      console.warn('⚠️ NO VARIANT FOUND');
    }
  }
  /* ================= OPTIONS ================= */
  prepareOptions(): void {
    this.colors = [
      ...new Map(
        this.variants
          .filter(v => v.color && v.ten_mau)
          .map(v => [v.color, { name: v.ten_mau, code: v.color }])
      ).values()
    ];

    this.sizes = [
      ...new Set(
        this.variants
          .filter(v => v.size)
          .map(v => v.size)
      )
    ];

    // ✅ Nếu chỉ có 1 variant (1 size + 1 màu), auto-select luôn
    if (this.variants.length === 1) {
      this.selectVariant(this.variants[0]);
    }
    // ✅ Auto-select nếu chỉ có 1 màu
    else if (this.colors.length === 1) {
      this.selectColor(this.colors[0].code);
    }
    // ✅ Auto-select nếu chỉ có 1 size
    else if (this.sizes.length === 1) {
      this.selectSize(this.sizes[0]);
    }
  }
  /* ================= PRICE ================= */
  calcPrice(): void {
    if (!this.variants.length) return;

    const prices = this.variants.map(v => v.giagoc);
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
  }
  /* ================= QUANTITY ================= */
  increaseQuantity(): void {
    if (this.selectedVariant && this.quantity < this.maxQuantity) {
      this.quantity++;
      this.validateQuantity();
    }
  }
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.validateQuantity();
    }
  }
  onQuantityChange(): void {
    this.validateQuantity();
  }
  validateQuantity(): void {
    if (this.quantity <= 0) {
      this.quantity = 1;
      this.quantityError = '⚠️ Số lượng phải lớn hơn 0 ⚠️';
    } else if (this.quantity > this.maxQuantity) {
      this.quantityError = `⚠️ Chỉ còn ${this.maxQuantity} sản phẩm ⚠️`;
    } else {
      this.quantityError = '';
    }
  }
  /* ================= CART ================= */
  addToCart(): void {
    // ✅ Kiểm tra đăng nhập
    if (!this.authService.getUserId()) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.selectedVariant) {
      alert('Vui lòng chọn màu và size');
      return;
    }

    // ✅ Kiểm tra hết hàng
    if (this.outOfStock) {
      alert(' Sản phẩm hết hàng');
      return;
    }

    // ✅ Kiểm tra số lượng
    if (this.quantity > this.maxQuantity) {
      alert(` Chỉ còn ${this.maxQuantity} sản phẩm`);
      return;
    }

    this.cartService.addToCart({
      id_sanpham: this.product._id,
      id_bienthe: this.selectedVariant._id,
      soluong: this.quantity
    }).subscribe({
      next: () => alert('✅ Đã thêm vào giỏ hàng'),
      error: err => console.error('Add cart error', err)
    });
  }
  muaNgay(): void {
    // ✅ Kiểm tra đăng nhập
    if (!this.authService.getUserId()) {
      alert(' Vui lòng đăng nhập để mua hàng');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.selectedVariant) {
      alert(' Vui lòng chọn màu và size');
      return;
    }

    // ✅ Kiểm tra hết hàng
    if (this.outOfStock) {
      alert(' Sản phẩm hết hàng');
      return;
    }

    // ✅ Kiểm tra số lượng
    if (this.quantity > this.maxQuantity) {
      alert(` Chỉ còn ${this.maxQuantity} sản phẩm`);
      return;
    }

    this.cartService.addToCart({
      id_sanpham: this.product._id,
      id_bienthe: this.selectedVariant._id,
      soluong: this.quantity
    }).subscribe({
      next: () => this.router.navigate(['/checkout']),
      error: err => console.error(' Add cart error', err)
    });
  }
  /* ================= TAB ================= */
  setTab(tab: 'desc' | 'review' | 'policy' | 'size'): void {
    this.activeTab = tab;
  }

  /* ================= RATING ================= */
  getStarArray(): number[] {
    const fullStars = Math.floor(this.avgRating);
    const hasHalfStar = this.avgRating % 1 !== 0;
    const stars: number[] = [];

    // Tạo mảng sao: 1=full, 0.5=half, 0=empty
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(1); // ⭐ full star
      } else if (i === fullStars && hasHalfStar) {
        stars.push(0.5); // ⭐ half star
      } else {
        stars.push(0); // ☆ empty star
      }
    }
    return stars;
  }
}
