import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from './../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { CartService } from '../../../services/cart.service';
import { FavoriteService } from '../../../services/favorite.service';
import { Category } from '../../../models/category';

import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [RouterModule, FormsModule, CommonModule],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isScrolled = false;

  keyword = '';
  showSearch = false;

  openMenu: 'ao' | 'cl' | null = null;
  showAccountMenu = false;

  categories: Category[] = [];
  selectedCategory: string | null = null;

  isADM = false;
  isLogin: any = null;

  cartQuantity = 0;
  favoriteCount = 0;
  favoriteProducts: any[] = [];

  isHomePage = false;

  bannerImages: string[] = ['assets/img/bannerhd1.png'];
  currentBannerIndex = 0;
  private bannerIntervalId: any = null;

  // ===== categories from DB =====
  aoDaBongParent: any = null;
  aoDaBongChildren: any[] = [];

  cauLongParent: any = null;
  cauLongChildren: any[] = [];

  giayBongDaParent: any = null;
  aoBongChuyenParent: any = null;
  phuKienParent: any = null;

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private favoriteService: FavoriteService
  ) {}

  @HostListener('window:scroll', [])
  onWinScroll() {
    this.isScrolled = window.scrollY > 30;
  }

  @HostListener('document:click')
  onDocClick() {
    this.closeMenus();
    this.showAccountMenu = false;
  }

  ngOnInit(): void {
    this.isADM = this.authService.checkAdmin();
    this.isLogin = this.authService.checkLogin();

    this.checkIfHomePage(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkIfHomePage(event.urlAfterRedirects || event.url);
        this.showSearch = false;
        this.closeMenus();
        this.showAccountMenu = false;
      });

    this.loadCategoriesFromDb();

    this.cartService.loadCartCount();
    this.cartService.cartCount$.subscribe((count) => {
      this.cartQuantity = count;
    });

    this.favoriteService.loadFavorites();
    this.favoriteService.favorites$.subscribe((favorites) => {
      this.favoriteProducts = favorites || [];
      this.favoriteCount = this.favoriteProducts.length;
    });

    if (this.isHomePage) this.startBannerSlideshow();
  }

  ngOnDestroy(): void {
    this.stopBannerSlideshow();
  }

  // ================= MENU =================
  toggleMenu(key: 'ao' | 'cl', ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    this.showAccountMenu = false;
    this.openMenu = this.openMenu === key ? null : key;
  }

  closeMenus() {
    this.openMenu = null;
  }

  // ================= ACCOUNT =================
  toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.closeMenus();
    this.showAccountMenu = !this.showAccountMenu;
  }

  goToAndClose(url: string): void {
    this.showAccountMenu = false;
    this.router.navigateByUrl(url);
  }

  logoutAndClose(): void {
    this.showAccountMenu = false;
    this.onLogout();
  }

  // ================= CATEGORY =================
  private loadCategoriesFromDb(): void {
    this.categoryService.getAll().subscribe({
      next: (data: any) => {
        this.categories = (data || []) as Category[];
        this.buildMenuFromCategories(this.categories as any[]);
      },
      error: () => {
        this.categories = [];
        this.buildMenuFromCategories([]);
      }
    });
  }

  private buildMenuFromCategories(categories: any[]): void {
    const activeCategories = (categories || [])
      .filter((c) => c?.isActive !== false)
      .sort((a, b) => (a?.order || 0) - (b?.order || 0));

    this.aoDaBongParent = this.findBySlug(activeCategories, 'do-da-banh');
    this.cauLongParent = this.findBySlug(activeCategories, 'cau-long-pickleball');
    this.giayBongDaParent = this.findBySlug(activeCategories, 'bi-da');
    this.aoBongChuyenParent = this.findBySlug(activeCategories, 'do-bong-chuyen');
    this.phuKienParent = this.findBySlug(activeCategories, 'phu-kien');

    this.aoDaBongChildren = this.getChildren(activeCategories, this.aoDaBongParent?._id);
    this.cauLongChildren = this.getChildren(activeCategories, this.cauLongParent?._id);
  }

  private findBySlug(categories: any[], slug: string): any | null {
    return categories.find((c) => c?.slug === slug) || null;
  }

  private getChildren(categories: any[], parentId: any): any[] {
    if (!parentId) return [];
    return categories.filter((c) => this.normalizeId(c?.parentId) === this.normalizeId(parentId));
  }

  private normalizeId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value?._id) return String(value._id);
    if (value?.$oid) return String(value.$oid);
    return String(value);
  }

  // ================= LOGOUT =================
  onLogout() {
    localStorage.clear();
    location.assign('/');
  }

  // ================= HOME =================
  checkIfHomePage(url: string): void {
    const u = (url || '').split('?')[0];
    this.isHomePage = u === '/' || u === '/home' || u === '/home/';

    if (this.isHomePage) this.startBannerSlideshow();
    else this.stopBannerSlideshow();
  }

  // ================= SEARCH =================
  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    this.showAccountMenu = false;
    this.closeMenus();
  }

  onSearchLeave(): void {
    if (!this.keyword.trim()) this.showSearch = false;
  }

  onSearch(): void {
    const k = (this.keyword || '').trim();
    if (!k) return;

    this.router.navigate(['/product'], {
      queryParams: { keyword: k }
    });

    this.keyword = '';
    this.showSearch = false;
  }

  // ================= BANNER =================
  private startBannerSlideshow(): void {
    if (!this.isHomePage) return;
    if (!this.bannerImages || this.bannerImages.length <= 1) return;
    if (this.bannerIntervalId) return;

    this.bannerIntervalId = setInterval(() => {
      this.currentBannerIndex = (this.currentBannerIndex + 1) % this.bannerImages.length;
    }, 5000);
  }

  private stopBannerSlideshow(): void {
    if (this.bannerIntervalId) {
      clearInterval(this.bannerIntervalId);
      this.bannerIntervalId = null;
    }
  }

  prevBanner(): void {
    if (!this.bannerImages?.length) return;
    this.currentBannerIndex =
      this.currentBannerIndex === 0
        ? this.bannerImages.length - 1
        : this.currentBannerIndex - 1;
  }

  nextBanner(): void {
    if (!this.bannerImages?.length) return;
    this.currentBannerIndex = (this.currentBannerIndex + 1) % this.bannerImages.length;
  }

  goToBanner(index: number): void {
    this.currentBannerIndex = index;
  }

  getCurrentBannerImage(): string {
    return this.bannerImages?.[this.currentBannerIndex] || 'assets/img/bannerhd1.png';
  }
}
