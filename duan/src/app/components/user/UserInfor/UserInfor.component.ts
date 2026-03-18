import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { OrderService } from '../../../services/order.service';
import { FavoriteService } from '../../../services/favorite.service';
import { User } from '../../../models/user';
import { Order } from '../../../models/order';
import { Favorite } from '../../../models/favorite';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './UserInfor.component.html',
  styleUrls: ['./UserInfor.component.scss']
})
export class UserInfoComponent implements OnInit {
  user!: User;
  editUser!: User;
  isEditing: boolean = false;

  orders: Order[] = [];
  favorites: Favorite[] = [];

  activeTab: string = 'orders';

  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // Avatar upload
  selectedFile: File | null = null;
  previewAvatar: string | ArrayBuffer | null = null;

  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private favoriteService: FavoriteService
  ) { }
  translateStatus(status: string | undefined): string {
    if (!status) return 'Chưa xác định';
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Chờ xử lý';
      case 'inprogress':
        return 'Đang xử lý';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      case 'returned':
        return 'Đã trả hàng';
      default:
        return status; // fallback: hiện tiếng Anh nếu ko map được
    }
  }


  ngOnInit(): void {
    this.loadUser();
    this.loadOrders();
    this.loadFavorites();
  }
  // ===== Orders =====
  isCancelable(status: string | undefined): boolean {
    if (!status) return false;
    const s = status.toLowerCase();
    // Chỉ cho huỷ khi đang chờ xử lý hoặc đang xử lý
    return ['pending', 'inprogress'].includes(s);
  }

  // ===== Tabs =====
  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.isEditing = false; // reset edit mode khi đổi tab
  }

  // ===== User =====
  loadUser() {
    this.userService.getUserInfo().subscribe(res => this.user = res);
  }

  enableEdit() {
    this.isEditing = true;
    this.editUser = { ...this.user }; // clone dữ liệu để edit
    this.activeTab = 'profile';
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedFile = null;
    this.previewAvatar = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => this.previewAvatar = reader.result;
      reader.readAsDataURL(file);
    }
  }

  updateProfile() {
    const formData = new FormData();
    formData.append('fullName', this.editUser.fullName || '');
    formData.append('email', this.editUser.email || '');
    if (this.editUser.phone) formData.append('phone', this.editUser.phone);
    if (this.editUser.address) formData.append('address', this.editUser.address);
    if (this.selectedFile) formData.append('avatar', this.selectedFile);

    this.userService.updateProfile(formData).subscribe({
      next: (res: any) => {
        this.user = res.user || res; // hỗ trợ cả 2 kiểu trả về
        this.isEditing = false;
        this.selectedFile = null;
        this.previewAvatar = null;
        alert('Cập nhật thông tin thành công');
        this.loadUser(); // lấy lại từ server
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Cập nhật thất bại');
      }
    });
  }

  changePassword() {
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      alert('Mật khẩu mới nhập lại không khớp');
      return;
    }
    this.userService.changePassword({
      oldPassword: this.oldPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        alert('Đổi mật khẩu thành công');
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Đổi mật khẩu thất bại');
      }
    });
  }

  // ===== Orders =====
  loadOrders() {
    this.orderService.getMyOrders().subscribe(res => this.orders = res);
  }

  cancelOrder(orderId: string) {
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        alert('Huỷ đơn thành công');
        this.loadOrders();
      },
      error: (err) => {
        console.error(err);
        alert('Huỷ đơn thất bại');
      }
    });
  }

  // ===== Favorites =====
  loadFavorites() {
    this.favoriteService.getFavorites().subscribe((res: Favorite[]) => {
      this.favorites = res;
    });
  }

  removeFavorite(id: string) {
    this.favoriteService.removeFavorite(id).subscribe(() => {
      this.favorites = this.favorites.filter(f => f._id !== id);
    });
  }
}
