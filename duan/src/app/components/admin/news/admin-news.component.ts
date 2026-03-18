import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminNewsService, NewsItem } from '../services/admin-news.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  templateUrl: './admin-news.component.html',
  styleUrls: ['./admin-news.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class AdminNewsComponent implements OnInit, OnDestroy {
  newsList: NewsItem[] = [];
  isLoading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedNews: NewsItem | null = null;

  newsForm: NewsItem = {
    title: '',
    content: '',
    description: '',
    image: ''
  };

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchTerm = '';
  filteredNews: NewsItem[] = [];
  newsStats = {
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0
  };

  private subscriptions = new Subscription();

  constructor(private adminNewsService: AdminNewsService) {}

  ngOnInit(): void {
    this.loadAllNews();
    this.loadNewsStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadAllNews(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.adminNewsService.getAllNews().subscribe({
        next: (data: NewsItem[]) => {
          console.log('Loaded news:', data);
          this.newsList = data;
          this.filteredNews = data;
          this.totalItems = data.length;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Lỗi khi tải tin tức:', error);
          this.isLoading = false;
          this.showNotification('Có lỗi xảy ra khi tải tin tức!', 'error');
        }
      })
    );
  }

  loadNewsStats(): void {
    this.subscriptions.add(
      this.adminNewsService.getNewsStats().subscribe({
        next: (stats) => {
          this.newsStats = stats;
        },
        error: (error) => {
          console.error('Lỗi khi tải thống kê:', error);
        }
      })
    );
  }

  // Fixed search method
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredNews = [...this.newsList];
      this.totalItems = this.newsList.length;
      this.currentPage = 1;
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredNews = this.newsList.filter(news =>
      news.title.toLowerCase().includes(searchTermLower) ||
      (news.description && news.description.toLowerCase().includes(searchTermLower)) ||
      (news.content && news.content.toLowerCase().includes(searchTermLower))
    );

    this.totalItems = this.filteredNews.length;
    this.currentPage = 1;
  }

  openAddModal(): void {
    this.isEditMode = false;
this.isModalOpen = true;
    this.resetForm();
    this.loadDraft();
  }

  openEditModal(news: NewsItem): void {
    this.isEditMode = true;
    this.isModalOpen = true;
    this.selectedNews = news;
    this.newsForm = {
      title: news.title,
      content: news.content || '',
      description: news.description || '',
      image: news.image || ''
    };
    this.loadDraft();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetForm();
    this.clearDraft();
  }

  // Fixed submit form method name to match HTML
  onSubmit(): void {
    // Validate required fields
    if (!this.newsForm.title?.trim()) {
      this.showNotification('Tiêu đề không được để trống!', 'error');
      return;
    }

    if (!this.newsForm.content?.trim()) {
      this.showNotification('Nội dung không được để trống!', 'error');
      return;
    }

    this.isLoading = true;
    const newsData: Omit<NewsItem, '_id' | 'createdAt' | 'updatedAt'> = {
      title: this.newsForm.title.trim(),
      content: this.newsForm.content?.trim() || '',
      description: this.newsForm.description?.trim() || '',
      image: this.newsForm.image?.trim() || ''
    };

    if (this.isEditMode && this.selectedNews?._id) {
      this.updateNews(newsData);
    } else {
      this.addNews(newsData);
    }
  }

  private addNews(newsData: Omit<NewsItem, '_id' | 'createdAt' | 'updatedAt'>): void {
    this.subscriptions.add(
      this.adminNewsService.addNews(newsData).subscribe({
        next: (newNews) => {
          this.newsList.unshift(newNews);
          this.filteredNews.unshift(newNews);
          this.totalItems++;
          this.closeModal();
          this.showNotification('Thêm tin tức thành công!', 'success');
          this.isLoading = false;
          this.loadNewsStats(); // Refresh stats
        },
        error: (error: any) => {
          console.error('Lỗi khi thêm tin tức:', error);
          this.showNotification(`Lỗi: ${error.message}`, 'error');
          this.isLoading = false;
        }
      })
    );
  }

  private updateNews(newsData: Omit<NewsItem, '_id' | 'createdAt' | 'updatedAt'>): void {
    if (!this.selectedNews?._id) {
      this.showNotification('Không tìm thấy ID tin tức để cập nhật!', 'error');
      this.isLoading = false;
      return;
    }

    this.subscriptions.add(
      this.adminNewsService.updateNews(this.selectedNews._id, newsData).subscribe({
        next: (updatedNews) => {
          // Update in both arrays
          const newsIndex = this.newsList.findIndex(n => n._id === updatedNews._id);
          if (newsIndex !== -1) {
            this.newsList[newsIndex] = updatedNews;
          }

          const filteredIndex = this.filteredNews.findIndex(n => n._id === updatedNews._id);
          if (filteredIndex !== -1) {
            this.filteredNews[filteredIndex] = updatedNews;
          }

          this.closeModal();
this.showNotification('Cập nhật tin tức thành công!', 'success');
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Lỗi khi cập nhật tin tức:', error);
          this.showNotification(`Lỗi: ${error.message}`, 'error');
          this.isLoading = false;
        }
      })
    );
  }

  deleteNews(id: string): void {
    if (!confirm('Bạn có chắc muốn xóa tin tức này?')) return;

    this.isLoading = true;
    this.subscriptions.add(
      this.adminNewsService.deleteNews(id).subscribe({
        next: () => {
          this.newsList = this.newsList.filter(n => n._id !== id);
          this.filteredNews = this.filteredNews.filter(n => n._id !== id);
          this.totalItems--;

          // Adjust current page if necessary
          if (this.paginatedNews.length === 0 && this.currentPage > 1) {
            this.currentPage--;
          }

          this.showNotification('Xóa tin tức thành công!', 'success');
          this.isLoading = false;
          this.loadNewsStats(); // Refresh stats
        },
        error: (error: any) => {
          console.error('Lỗi khi xóa tin tức:', error);
          this.showNotification(`Lỗi: ${error.message}`, 'error');
          this.isLoading = false;
        }
      })
    );
  }

  resetForm(): void {
    this.newsForm = {
      title: '',
      content: '',
      description: '',
      image: ''
    };
    this.selectedNews = null;
  }

  // Fixed pagination methods
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const totalPages = this.totalPages;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(totalPages, start + maxPagesToShow - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedNews(): NewsItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredNews.slice(start, start + this.itemsPerPage);
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    // Simple alert for now - you can replace with a proper notification system
    const prefix = type === 'success' ? '✅ Thành công' : '❌ Lỗi';
    alert(`${prefix}: ${message}`);
  }

  formatDate(date: Date | string | undefined): string {
    return this.adminNewsService.formatDate(date);
  }

  truncateText(text: string, maxLength: number = 100): string {
    return this.adminNewsService.truncateText(text, maxLength);
  }

  // Draft functionality
  autoSaveDraft(): void {
if (!this.isModalOpen || !this.newsForm.title?.trim()) return;

    const draftKey = `news-draft-${this.selectedNews?._id || 'new'}`;
    const draftData = {
      ...this.newsForm,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      console.log('Draft saved automatically');
    } catch (error) {
      console.warn('Could not save draft:', error);
    }
  }

  loadDraft(): void {
    if (!this.isModalOpen) return;

    const draftKey = `news-draft-${this.selectedNews?._id || 'new'}`;
    try {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const draft = JSON.parse(draftData);
        if (confirm('Tìm thấy bản nháp đã lưu. Bạn có muốn khôi phục không?')) {
          this.newsForm = {
            title: draft.title || '',
            content: draft.content || '',
            description: draft.description || '',
            image: draft.image || ''
          };
        }
      }
    } catch (error) {
      console.warn('Could not load draft:', error);
    }
  }

  clearDraft(): void {
    const draftKey = `news-draft-${this.selectedNews?._id || 'new'}`;
    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.warn('Could not clear draft:', error);
    }
  }

  // Export functionality
  exportToCSV(): void {
    if (this.newsList.length === 0) {
      this.showNotification('Không có dữ liệu để xuất', 'error');
      return;
    }

    const headers = ['Tiêu đề', 'Mô tả', 'Nội dung', 'Hình ảnh', 'Ngày tạo', 'Ngày cập nhật'];
    const csvContent = [
      headers.join(','),
      ...this.newsList.map(news => [
        `"${(news.title || '').replace(/"/g, '""')}"`,
        `"${(news.description || '').replace(/"/g, '""')}"`,
        `"${(news.content || '').replace(/"/g, '""').substring(0, 100)}..."`,
        `"${(news.image || '').replace(/"/g, '""')}"`,
        `"${this.formatDate(news.createdAt)}"`,
        `"${this.formatDate(news.updatedAt)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `tin-tuc-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showNotification('Xuất dữ liệu thành công!', 'success');
  }
}
