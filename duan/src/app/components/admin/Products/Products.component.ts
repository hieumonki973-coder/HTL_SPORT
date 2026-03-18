import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Product, Category } from '../../model-admin/product.model';
import { ProductService } from '../../services-admin/product';
import { CategoryService } from '../../services-admin/category';

@Component({
  selector: 'app-product-admin',
  standalone: true,
  templateUrl: './Products.component.html',
  styleUrls: ['./Products.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class ProductAdminComponent implements OnInit {

  /* ================= DATA ================= */

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  /* ================= STATE ================= */

  isLoadingProducts = false;
  errorProducts = '';
  selectAll = false;
  hasSelectedProducts = false;

  /* ================= PAGINATION ================= */

  currentPage = 1;
  pageSize = 8;
  totalPages = 1;
  pageNumbers: number[] = [];

  /* ================= STATS ================= */

  productStats = {
    totalProducts: 0,
    inStockProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  };

  /* ================= MODAL ================= */

  isAddModalOpen = false;
  isEditModalOpen = false;

  /* ================= ADD ================= */

  newProduct: any = {
    ten: '',
    desc: '',
    hinh: [],
    categoryIds: [],
    bienthe: [],
  };

  /* ================= EDIT ================= */

  editProduct: any;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {

    console.log('🚀 ProductAdminComponent INIT');

    this.loadProducts();
    this.loadCategories();

    setTimeout(() => {
      console.log('⏱ categories after load:', this.categories);
    }, 2000);
  }

  /* ================= IMAGE ================= */

  onImageFileSelected(event: Event, isEdit: boolean = false) {

    console.log('📸 onImageFileSelected');

    const input = event.target as HTMLInputElement;

    if (!input.files || !input.files.length) {
      console.warn('⚠️ No file selected');
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {

      const base64 = reader.result as string;

      console.log('🖼️ image base64 length:', base64.length);

      if (isEdit && this.editProduct) {

        this.editProduct.hinh = this.editProduct.hinh || [];
        this.editProduct.hinh.push(base64);

        console.log('✏️ editProduct images:', this.editProduct.hinh);

      } else {

        this.newProduct.hinh.push(base64);

        console.log('➕ newProduct images:', this.newProduct.hinh);

      }
    };

    reader.readAsDataURL(file);
  }

  /* ================= LOAD PRODUCTS ================= */

  loadProducts(): void {

    console.log('📡 loadProducts()');

    this.isLoadingProducts = true;

    this.productService.getAll().subscribe({

      next: (res: any) => {

        console.log('📦 RAW PRODUCT RESPONSE:', res);

        const rawProducts = Array.isArray(res)
          ? res
          : res.products || [];

        console.log('📊 total rawProducts:', rawProducts.length);

        this.products = rawProducts.map((p: any, index: number) => {

          const mapped = {

            _id: p._id,
            ten: p.ten || '',
            desc: p.desc || p.mota || '',
            hinh: Array.isArray(p.hinh) ? p.hinh : [],
            categories: Array.isArray(p.categories) ? p.categories : [],
            bienthe: Array.isArray(p.bienthe) ? p.bienthe : [],
            deleted_at: p.deleted_at ?? null,
            selected: false,

          };

          console.log(`📦 mapped product ${index}`, mapped);

          return mapped;

        });

        console.log('✅ products mapped:', this.products);

        this.applyPagination();
        this.calculateStats();

        this.isLoadingProducts = false;

      },

      error: (err) => {

        console.error('❌ loadProducts error', err);

        this.errorProducts = 'Không thể tải sản phẩm';
        this.isLoadingProducts = false;

      }

    });
  }

  /* ================= LOAD CATEGORIES ================= */

  loadCategories(): void {

    console.log('📡 loadCategories()');

    this.categoryService.getCategories().subscribe({

      next: (res: any) => {

        console.log('📂 RAW CATEGORY RESPONSE:', res);

        this.categories = Array.isArray(res)
          ? res
          : res.categories || [];

        console.log('✅ categories mapped:', this.categories);
        console.log('📊 total categories:', this.categories.length);

        this.categories.forEach((c, i) => {
          console.log(`📂 category ${i}`, c);
        });

      },

      error: (err) => {

        console.error('❌ Load categories error', err);

      }

    });
  }

  /* ================= STATS ================= */

  calculateStats(): void {

    console.log('📊 calculateStats');

    this.productStats.totalProducts = this.products.length;

    let inStock = 0;
    let lowStock = 0;
    let outStock = 0;

    this.products.forEach(p => {

      const totalStock = (p.bienthe || []).reduce(
        (sum, b) => sum + Number(b.soluong || 0),
        0
      );

      console.log('📦 product stock:', p.ten, totalStock);

      if (totalStock === 0) outStock++;
      else if (totalStock < 10) lowStock++;
      else inStock++;

    });

    this.productStats.inStockProducts = inStock;
    this.productStats.lowStockProducts = lowStock;
    this.productStats.outOfStockProducts = outStock;

    console.log('📊 productStats:', this.productStats);

  }

  /* ================= TABLE ================= */

  trackByProductId(_: number, p: Product) {
    return p._id;
  }

  toggleSelectAll(): void {

    console.log('☑️ toggleSelectAll:', this.selectAll);

    this.filteredProducts.forEach(p => p.selected = this.selectAll);

    this.updateSelectedProducts();

  }

  updateSelectedProducts(): void {

    this.hasSelectedProducts = this.filteredProducts.some(p => p.selected);

    console.log('🗑️ hasSelectedProducts:', this.hasSelectedProducts);

  }

  /* ================= CATEGORY NAME ================= */

  getCategoryName(product: Product): string {

    console.log('🏷️ getCategoryName:', product.categories);

    if (!product.categories?.length) return '-';

    return product.categories
      .map(c => (typeof c === 'string' ? c : c.ten))
      .join(', ');

  }

  /* ================= PRICE RANGE ================= */

  getProductPriceRange(product: Product): string {

    if (!product.bienthe?.length) return '-';

    const prices = product.bienthe.map(b => Number(b.giagoc || 0));

    console.log('💰 price range:', prices);

    return `${Math.min(...prices)} - ${Math.max(...prices)}₫`;

  }

  /* ================= PAGINATION ================= */

  applyPagination(): void {

    console.log('📄 applyPagination');

    this.totalPages = Math.ceil(this.products.length / this.pageSize);

    this.pageNumbers = Array.from(
      { length: this.totalPages },
      (_, i) => i + 1
    );

    const start = (this.currentPage - 1) * this.pageSize;

    this.filteredProducts =
      this.products.slice(start, start + this.pageSize);

    console.log('📄 filteredProducts:', this.filteredProducts);

  }

  changePage(page: number): void {

    console.log('➡️ changePage:', page);

    this.currentPage = page;

    this.applyPagination();

  }

  /* ================= ADD PRODUCT ================= */

  openAddModal(): void {

    console.log('➕ openAddModal');

    this.newProduct = {
      ten: '',
      desc: '',
      hinh: [],
      categoryIds: [],
      bienthe: [],
    };

    this.isAddModalOpen = true;

  }

  closeAddModal(): void {

    console.log('❌ closeAddModal');

    this.isAddModalOpen = false;

  }

  addVariantToNewProduct(): void {

    console.log('➕ addVariantToNewProduct');

    this.newProduct.bienthe.push({
      color: '',
      size: '',
      giagoc: 0,
      soluong: 0,
    });

  }

  removeVariantFromNewProduct(i: number): void {

    console.log('❌ removeVariantFromNewProduct', i);

    this.newProduct.bienthe.splice(i, 1);

  }

  addProduct(): void {

    const payload = {
      ...this.newProduct,
      categories: this.newProduct.categoryIds
    };

    delete payload.categoryIds;

    console.log('📤 addProduct payload:', payload);

    this.productService.create(payload).subscribe({

      next: (res) => {

        console.log('✅ product created:', res);

        this.closeAddModal();
        this.loadProducts();

      }

    });

  }

  /* ================= EDIT PRODUCT ================= */

  openEditModal(p: Product): void {

    console.log('✏️ openEditModal product:', p);

    this.editProduct = {

      ...JSON.parse(JSON.stringify(p)),

      categoryIds: (p.categories || []).map((c: any) =>
        typeof c === 'string' ? c : c._id
      ),

    };

    console.log('🛠️ editProduct mapped:', this.editProduct);
    console.log('📂 editProduct.categoryIds:', this.editProduct.categoryIds);
    console.log('📦 categories list:', this.categories);

    this.isEditModalOpen = true;

  }

  closeEditModal(): void {

    console.log('❌ closeEditModal');

    this.isEditModalOpen = false;

  }

  addVariantToEditProduct(): void {

    console.log('➕ addVariantToEditProduct');

    this.editProduct.bienthe.push({
      color: '',
      size: '',
      giagoc: 0,
      soluong: 0,
    });

  }

  removeVariantFromEditProduct(i: number): void {

    console.log('❌ removeVariantFromEditProduct', i);

    this.editProduct.bienthe.splice(i, 1);

  }

  updateProduct(): void {

    const payload = {

      ...this.editProduct,

      categories: this.editProduct.categoryIds

    };

    delete payload.categoryIds;

    console.log('📤 updateProduct payload:', payload);

    this.productService
      .update(this.editProduct._id, payload)
      .subscribe({

        next: (res) => {

          console.log('✅ product updated:', res);

          this.closeEditModal();
          this.loadProducts();

        }

      });

  }

  /* ================= DELETE ================= */

  deleteProduct(p: Product): void {

    console.log('🗑️ deleteProduct:', p);

    if (!confirm('Xóa sản phẩm này?')) return;

    this.productService.delete(p._id).subscribe(() => {

      console.log('✅ product deleted');

      this.loadProducts();

    });

  }

  deleteSelectedProducts(): void {

    const ids = this.filteredProducts
      .filter(p => p.selected)
      .map(p => p._id);

    console.log('🗑️ deleteSelectedProducts:', ids);

    this.productService.deleteMany(ids).subscribe(() => {

      console.log('✅ deleteMany done');

      this.loadProducts();

    });

  }

  /* ================= EXPORT ================= */

  exportProducts(): void {

    console.log('📁 exportProducts');

    this.productService.exportCSV();

  }

  /* ================= LOGOUT ================= */

  logout(): void {

    console.log('🚪 logout');

    localStorage.clear();
    location.href = '/admin/login';

  }
trackByCategory(index:number,item:any){
  return item._id;
}
}
