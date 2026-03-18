import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CategoryService } from '../../services-admin/category';
import { Category } from '../../model-admin/category.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-category',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.css']
})
export class ProductCategoryComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  filteredCategories: Category[] = [];

  searchTerm = '';
  statusFilter: '' | 'active' | 'inactive' = '';

  totalCategories = 0;
  activeCategories = 0;
  inactiveCategories = 0;

  isAddModalOpen = false;
  isEditing = false;

  currentCategory: Category = {
    ten: '',
    code:'',
    trangthai: 'active'
  };

  errorMessage = '';
  private subscriptions = new Subscription();

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /* ================= LOAD ================= */
  loadCategories(): void {
    this.subscriptions.add(
      this.categoryService.getCategories().subscribe({
        next: (res: Category[]) => {
          this.categories = res || [];
          this.filteredCategories = [...this.categories];
          this.updateStats();
        },
        error: (err: HttpErrorResponse) => {
          console.error(err);
          this.errorMessage = 'Lỗi tải danh mục';
        }
      })
    );
  }

  /* ================= FILTER ================= */
  applyFilters(): void {
    this.filteredCategories = this.categories.filter(c =>
      c.ten.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
      (this.statusFilter ? c.trangthai === this.statusFilter : true)
    );
    this.updateStats();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  updateStats(): void {
    this.totalCategories = this.filteredCategories.length;
    this.activeCategories = this.filteredCategories.filter(c => c.trangthai === 'active').length;
    this.inactiveCategories = this.filteredCategories.filter(c => c.trangthai === 'inactive').length;
  }

  /* ================= MODAL ================= */
  openAddModal(): void {
    this.currentCategory = {
      ten: '',
      code:'',
      trangthai: 'active'
    };
    this.isEditing = false;
    this.isAddModalOpen = true;
  }

  editCategory(category: Category): void {
    this.currentCategory = { ...category };
    this.isEditing = true;
    this.isAddModalOpen = true;
  }

  closeModal(): void {
    this.isAddModalOpen = false;
    this.errorMessage = '';
  }

  /* ================= SAVE ================= */
  saveCategory(): void {
    if (!this.currentCategory.ten) {
      this.errorMessage = 'Tên danh mục không được để trống';
      return;
    }

    if (this.isEditing && this.currentCategory._id) {
      this.subscriptions.add(
        this.categoryService.updateCategory(this.currentCategory._id, this.currentCategory)
          .subscribe({
            next: updated => {
              this.categories = this.categories.map(c =>
                c._id === updated._id ? updated : c
              );
              this.applyFilters();
              this.closeModal();
            },
            error: () => this.errorMessage = 'Lỗi cập nhật danh mục'
          })
      );
    } else {
      this.subscriptions.add(
        this.categoryService.createCategory(this.currentCategory)
          .subscribe({
            next: created => {
              this.categories.push(created);
              this.applyFilters();
              this.closeModal();
            },
            error: () => this.errorMessage = 'Lỗi thêm danh mục'
          })
      );
    }
  }

  /* ================= DELETE ================= */
  deleteCategory(id?: string): void {
    if (!id) return;
    if (!confirm('Bạn chắc chắn muốn xóa danh mục này?')) return;

    this.subscriptions.add(
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.categories = this.categories.filter(c => c._id !== id);
          this.applyFilters();
        },
        error: () => this.errorMessage = 'Lỗi xóa danh mục'
      })
    );
  }

  /* ================= UTILS ================= */
  translateStatus(status: string): string {
    return status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động';
  }

  trackByCategoryId(_: number, c: Category): string | undefined {
    return c._id;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
  exportData(): void {
  const csvContent = [
    'Tên danh mục,Trạng thái',
    ...this.filteredCategories.map(c =>
      `"${c.ten}","${this.translateStatus(c.trangthai)}"`
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'categories.csv';
  link.click();
}

viewAllCategories(event: Event): void {
  event.preventDefault();
  this.resetFilters();
}

}
