import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  showInfo(message: string): void {
    alert(`Info: ${message}`);
  }
  showSuccess(message: string): void {
    alert(`Success: ${message}`);
  }

  showError(message: string): void {
    alert(`Error: ${message}`);
  }

  handleApiError(error: any): void {
    const message = error.error?.message || 'Có lỗi xảy ra, vui lòng thử lại!';
    this.showError(message);
  }
}
