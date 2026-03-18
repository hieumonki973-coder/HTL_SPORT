import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { Product } from '../../../models/product';
import { Category } from '../../../models/category';
import { Variant } from '../../../models/variant';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { NewsService } from '../../../services/news.service';
import { CartService } from '../../../services/cart.service';
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class HomeComponent implements OnInit, OnDestroy {
  /* ================= STATE (Template dùng) ================= */
  loading = false;
  successMessage: string | null = null;
  authMessage: string | null = null;

  // ===== SẢN PHẨM MỚI =====
  featuredProducts: Product[] = [];
  featuredProduct: Product | null = null;
  featuredImages: string[] = [];
  currentPlantIndex = 0;
  private featuredIntervalId: any;

  // ===== DANH MỤC SẢN PHẨM (grid + xem thêm) =====
  categories: Category[] = [];
  productsByCategory: Array<{ category: Category; products: Product[] }> = [];

  categoryLimit = 6;
  showAllCategories = false;

  get visibleCategories() {
    const list = this.productsByCategory || [];
    return this.showAllCategories ? list : list.slice(0, this.categoryLimit);
  }

  get shouldShowToggleCategories(): boolean {
    const list = this.productsByCategory || [];
    return list.length > this.categoryLimit;
  }

  // ===== NHÓM SẢN PHẨM NAM / NỮ / TRẺ EM =====
  audienceSections: Array<{
    key: string;
    title: string;
    description: string;
    buttonText: string;
    products: Product[];
    categoryId?: string;
  }> = [
      {
        key: 'nam',
        title: 'QUẦN ÁO NAM',
        description: 'Các sản phẩm thể thao nam năng động, thoải mái, phù hợp tập luyện và thi đấu.',
        buttonText: 'MUA NGAY',
        products: [],
        categoryId: ''
      },
      {
        key: 'nu',
        title: 'QUẦN ÁO NỮ',
        description: 'Bộ sưu tập thể thao nữ trẻ trung, tôn dáng, phù hợp nhiều hoạt động vận động.',
        buttonText: 'MUA NGAY',
        products: [],
        categoryId: ''
      },

    ];

  // ===== NEWS =====
  newsList: any[] = [];
  visibleNews: any[] = [];
  currentNewsIndex = 0;
  newsPerPage = 6;
  private newsIntervalId: any;

  private subscriptions = new Subscription();

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private newsService: NewsService,
     private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  private normalizeId(value: any): string {
    if (!value) return '';

    if (typeof value === 'string') return value;
    if (value?._id) return String(value._id);
    if (value?.$oid) return String(value.$oid);

    return String(value);
  }

  /* ================= LIFECYCLE ================= */
  ngOnInit(): void {
    this.listenAuthMessage();

    this.loadCategoriesWithProducts();
    this.loadNewestProducts();
    this.loadAudienceProducts();
    this.loadNews();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    clearInterval(this.newsIntervalId);
    clearInterval(this.featuredIntervalId);
  }

  /* ================= AUTH ================= */
  private listenAuthMessage(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        if (params['message'] === 'auth_required') {
          this.authMessage = '❌ Bạn cần đăng nhập';
          setTimeout(() => (this.authMessage = null), 3000);
        }
      })
    );
  }

  /* ================= SẢN PHẨM MỚI ================= */
  private loadNewestProducts(): void {
    this.subscriptions.add(
      this.productService.getAll().subscribe({
        next: (res: any) => {
          const products: Product[] = res?.products || res || [];

          if (!products.length) return;

          this.featuredProducts = products.slice(0, 4);
          this.featuredProduct = this.featuredProducts[0] || null;

          if (!this.featuredProduct) return;

          this.featuredImages =
            (this.featuredProduct as any)?.hinh?.map((h: any) => h?.url).filter(Boolean) || [];

          this.currentPlantIndex = 0;
          this.startAutoFeatured();
        },
        error: err => {
          console.error('❌ NEWEST (getAll) API ERROR:', err);
        }
      })
    );
  }

  selectFeaturedProduct(product: Product): void {
    const index = this.featuredProducts.findIndex(p => p._id === product._id);
    if (index === -1) return;

    this.featuredProduct = this.featuredProducts[index];
    this.featuredImages =
      (this.featuredProduct?.hinh || []).map((h: any) => h?.url).filter(Boolean);

    this.currentPlantIndex = 0;
  }

  private startAutoFeatured(): void {
    clearInterval(this.featuredIntervalId);
    this.featuredIntervalId = setInterval(() => {
      if (!this.featuredProducts.length) return;

      const currentId = this.featuredProduct?._id;
      const currentIndex = this.featuredProducts.findIndex(p => p._id === currentId);
      const nextIndex = (currentIndex + 1) % this.featuredProducts.length;

      this.selectFeaturedProduct(this.featuredProducts[nextIndex]);
    }, 4000);
  }

  /* ================= DANH MỤC SẢN PHẨM ================= */
  toggleCategories(): void {
    this.showAllCategories = !this.showAllCategories;
  }

  goToCategory(categoryId: any, parentId?: any): void {
    const child = this.normalizeId(categoryId);
    const parent = this.normalizeId(parentId);

    if (parent) {
      this.router.navigate(['/product'], {
        queryParams: {
          category: parent,
          danhmuc: child
        }
      });
      return;
    }

    this.router.navigate(['/product'], {
      queryParams: {
        category: child
      }
    });
  }

  private loadCategoriesWithProducts(): void {
    this.loading = true;

    this.subscriptions.add(
      forkJoin({
        categories: this.categoryService.getAll(),
        products: this.productService.getAll()
      }).subscribe({
        next: ({ categories, products }) => {
          this.categories = categories || [];

          const productMap = new Map<string, Product[]>();

          (products || []).forEach((p: any) => {
            p.selectedVariantId = p.bienthe?.[0]?._id;

            p.dm_sp?.forEach((dm: any) => {
              const catId =
                typeof dm.id_danhmuc === 'string'
                  ? dm.id_danhmuc
                  : dm.id_danhmuc?._id;

              if (!catId) return;

              if (!productMap.has(catId)) productMap.set(catId, []);
              productMap.get(catId)!.push(p);
            });
          });

          this.productsByCategory = this.categories
            .map(cat => ({
              category: cat,
              products: (productMap.get(cat._id) || []).slice(0, 8)
            }))
            .filter(item => item.products.length > 0);

          this.loading = false;
        },
        error: err => {
          console.error('❌ loadCategoriesWithProducts error:', err);
          this.loading = false;
        }
      })
    );
  }

  /* ================= NHÓM NAM / NỮ / TRẺ EM ================= */
private loadAudienceProducts(): void {
  this.subscriptions.add(
    this.productService.getAll().subscribe({
      next: (res: any) => {
        const allProducts: Product[] = res?.products || res || [];

        console.log('ALL PRODUCTS:', allProducts);

        allProducts.forEach((p: any) => {
          p.selectedVariantId = p.bienthe?.[0]?._id;
        });

        const namProducts = allProducts.filter((p: any) => p.doituong === 'nam').slice(0, 4);
        const nuProducts = allProducts.filter((p: any) => p.doituong === 'nu').slice(0, 4);


        console.log('NAM:', namProducts);
        console.log('NU:', nuProducts);


        this.audienceSections = [
          {
            key: 'nam',
            title: 'QUẦN ÁO NAM',
            description: 'Các sản phẩm thể thao nam năng động, thoải mái, phù hợp tập luyện và thi đấu.',
            buttonText: 'MUA NGAY',
            products: namProducts,
            categoryId: 'nam'
          },
          {
            key: 'nu',
            title: 'QUẦN ÁO NỮ',
            description: 'Bộ sưu tập thể thao nữ trẻ trung, tôn dáng, phù hợp nhiều hoạt động vận động.',
            buttonText: 'MUA NGAY',
            products: nuProducts,
            categoryId: 'nu'
          },

        ];
      },
      error: (err) => {
        console.error('❌ loadAudienceProducts error:', err);
      }
    })
  );
}

  private findCategoryByKeywords(categories: Category[], keywords: string[]): Category | undefined {
    return categories.find((cat: any) => {
      const name = this.normalizeText(cat?.ten || cat?.name || '');
      const slug = this.normalizeText(cat?.slug || cat?.key || '');

      return keywords.some(keyword => {
        const kw = this.normalizeText(keyword);
        return name.includes(kw) || slug.includes(kw);
      });
    });
  }

  private filterProductsByCategory(products: Product[], categoryId?: string): Product[] {
    if (!categoryId) return [];

    return products.filter((p: any) => {
      return (p.dm_sp || []).some((dm: any) => {
        const catId =
          typeof dm.id_danhmuc === 'string'
            ? dm.id_danhmuc
            : dm.id_danhmuc?._id;

        return catId === categoryId;
      });
    });
  }

  private normalizeText(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

goToAudienceSection(section: any): void {
  this.router.navigate(['/product'], {
    queryParams: {
      doiTuong: section.key
    }
  });
}

  viewProductDetail(product: any): void {
    if (!product?._id) return;
    this.router.navigate(['/product-detail', product._id]);
  }

  /* ================= NEWS ================= */
  loadNews(): void {
    this.subscriptions.add(
      this.newsService.getAllNews().subscribe(data => {
        this.newsList = data || [];
        this.currentNewsIndex = 0;
        this.updateVisibleNews();

        if (this.newsList.length) this.startNewsAutoSlide();
      })
    );
  }

  private updateVisibleNews(): void {
    this.visibleNews = this.newsList.slice(
      this.currentNewsIndex,
      this.currentNewsIndex + this.newsPerPage
    );
  }

  private startNewsAutoSlide(): void {
    clearInterval(this.newsIntervalId);
    this.newsIntervalId = setInterval(() => {
      if (!this.newsList.length) return;

      this.currentNewsIndex =
        (this.currentNewsIndex + this.newsPerPage) % this.newsList.length;

      this.updateVisibleNews();
    }, 5000);
  }

  prevNews(): void {
    if (!this.newsList.length) return;

    this.currentNewsIndex =
      this.currentNewsIndex === 0
        ? Math.max(this.newsList.length - this.newsPerPage, 0)
        : this.currentNewsIndex - this.newsPerPage;

    this.updateVisibleNews();
  }

  nextNews(): void {
    if (!this.newsList.length) return;

    this.currentNewsIndex =
      (this.currentNewsIndex + this.newsPerPage) % this.newsList.length;

    this.updateVisibleNews();
  }

  getNewsDate(news: any): Date {
    return news?.createdAt || news?.date || new Date();
  }

  /* ================= HELPERS (Template dùng) ================= */
  getProductImage(product: any): string {
    if (!product?.hinh || product.hinh.length === 0) return 'assets/img/no-image.png';

    const selectedVariantId = product.selectedVariantId || product.bienthe?.[0]?._id;

    const variantImage = product.hinh.find((img: any) => {
      const imgVariantId =
        typeof img.id_bienthe === 'string' ? img.id_bienthe : img.id_bienthe?._id;

      return imgVariantId === selectedVariantId;
    });

    return variantImage?.url || product.hinh[0].url;
  }

  getMinPrice(bienthe: Variant[]): number {
    if (!bienthe?.length) return 0;
    return Math.min(...bienthe.map(v => v.giagoc));
  }

  getOldPrice(bienthe: Variant[]): number {
    if (!bienthe?.length) return 0;

    const min = Math.min(...bienthe.map(v => v.giagoc || 0));
    return Math.round(min * 1.1);
  }

  getDiscountPercent(bienthe: Variant[]): number {
    const current = this.getMinPrice(bienthe);
    const old = this.getOldPrice(bienthe);

    if (!current || !old || old <= current) return 0;
    return Math.round(((old - current) / old) * 100);
  }
addToCartFromHome(product: any, event?: Event): void {
  event?.stopPropagation();

  if (!product?._id) return;

  const firstVariant = product?.bienthe?.[0];
  if (!firstVariant?._id) {
    this.authMessage = '❌ Sản phẩm chưa có biến thể';
    setTimeout(() => (this.authMessage = null), 3000);
    return;
  }

  const cartItem = {
    id_sanpham: product._id,
    id_bienthe: firstVariant._id,
    soluong: 1,
    ten: product.ten,
    gia: firstVariant.giagoc || 0,
    hinh: this.getProductImage(product),
    selectedSize: firstVariant.kichthuoc || '',
    selectedColor: firstVariant.mausac || ''
  };

  const token = localStorage.getItem('token');

  if (!token) {
    this.cartService.addToLocalCart(cartItem);
    this.successMessage = ' Đã thêm vào giỏ hàng';
    setTimeout(() => (this.successMessage = null), 2500);
    this.cartService.loadCartCount();
    return;
  }

  this.subscriptions.add(
    this.cartService.addToCart(cartItem).subscribe({
      next: (res) => {
        this.successMessage = res.message || ' Đã thêm vào giỏ hàng';
        setTimeout(() => (this.successMessage = null), 2500);
        this.cartService.loadCartCount();
      },
      error: (err) => {
        console.error('❌ addToCartFromHome error:', err);
        this.authMessage = '❌ Không thể thêm vào giỏ hàng';
        setTimeout(() => (this.authMessage = null), 2500);
      }
    })
  );
}
}
