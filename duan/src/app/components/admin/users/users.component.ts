import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User, UserStats } from '../services/users.service';
import { forkJoin, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {
  statusFilter: string = '';
  searchTerm: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  // Added to fix compile error from applyFilters()
  categories: any[] = [];
  filteredCategories: any[] = [];
  userStats: UserStats = { totalUsers: 0, activeUsers: 0, lockedUsers: 0, totalViolations: 0, pendingUsers: 0 };
  isLoadingUsers = true;
  isLoadingStats = true;
  errorUsers: string | null = null;
  errorStats: string | null = null;
  isUsersModalOpen = false;
  selectAll = false;
  hasSelectedUsers = false;
  private subscriptions: Subscription = new Subscription();

  constructor(private usersService: UsersService, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadData(): void {
    this.isLoadingUsers = true;
    this.isLoadingStats = true;
    this.subscriptions.add(
      forkJoin({
        users: this.usersService.getUsers(),
        stats: this.usersService.getUserStats()
      }).subscribe({
        next: ({ users, stats }) => {
          console.log('Raw users response:', users);
          console.log('Raw user stats response:', stats);
          this.users = users.map(user => ({
            ...user,
            selected: user.selected ?? false,
            status: user.status ?? 'pending'
          }));
          this.filteredUsers = [...this.users];
          const totalViolations = this.users.reduce((sum, user) =>
            sum + (user.spamCount || 0) + (user.cancellationCount || 0) + (user.ghostingCount || 0), 0);
          this.userStats = { ...stats, totalViolations };
          this.isLoadingUsers = false;
          this.isLoadingStats = false;
          console.log('Processed userStats:', this.userStats);
          console.log('Processed users:', this.users);
        },
        error: (err: HttpErrorResponse) => {
          console.error('UsersComponent: Error loading data:', err);
          console.error('Error details:', err.message, err.status, err.error);
          this.errorUsers = 'Lỗi khi tải danh sách người dùng';
          this.errorStats = 'Lỗi khi tải thống kê';
          this.isLoadingUsers = false;
          this.isLoadingStats = false;
          console.log('userStats on error:', this.userStats);
        }
      })
    );
  }

  addNewUser(): void {
    const newUser: Partial<User> = {
      name: 'Khách Hàng Mới',
      email: `newcustomer${this.users.length + 1}@example.com`,
      phone: 'N/A',
      address: 'N/A',
      status: 'pending',
      spamCount: 0,
      cancellationCount: 0,
      ghostingCount: 0,
      orderCount: 0,
      returnCount: 0,
      products: []
    };
    this.subscriptions.add(
      this.usersService.addUser(newUser).subscribe({
        next: (addedUser) => {
          this.users.unshift({ ...addedUser, selected: false, status: addedUser.status ?? 'pending' });
          this.filteredUsers = [...this.users];
          this.userStats.totalUsers++;
          this.userStats.pendingUsers++;
          this.userStats.totalViolations += (addedUser.spamCount || 0) + (addedUser.cancellationCount || 0) + (addedUser.ghostingCount || 0);
          alert('Thêm khách hàng mới thành công!');
        },
        error: (err: HttpErrorResponse) => {
          console.error('UsersComponent: Error adding user:', err);
          alert('Lỗi khi thêm khách hàng mới!');
        }
      })
    );
  }

  getPendingUsers(): number {
    return this.userStats.pendingUsers;
  }

  toggleLockUser(user: User): void {
    const newStatus = user.status === 'active' ? 'locked' : 'active';
    this.subscriptions.add(
      this.usersService.toggleLockUser(user._id, newStatus === 'locked' ? 'Manually locked by admin' : null).subscribe({
        next: (updatedUser) => {
          const userIndex = this.users.findIndex(u => u._id === updatedUser._id);
          if (userIndex !== -1) {
            this.users[userIndex] = { ...updatedUser, selected: this.users[userIndex].selected, status: updatedUser.status ?? 'pending' };
            this.filteredUsers = [...this.users];
          }
          alert(`Tài khoản ${user.name} đã được ${newStatus === 'locked' ? 'khóa' : 'mở khóa'}!`);
        },
        error: (err: HttpErrorResponse) => {
          console.error('UsersComponent: Error toggling user status:', err);
          alert('Lỗi khi cập nhật trạng thái tài khoản!');
        }
      })
    );
  }

  viewUserDetails(user: User): void {
    const violations = this.getViolationDetails(user);
    alert(`Chi tiết khách hàng:
Tên: ${user.name}
Email: ${user.email}
Số Điện Thoại: ${user.phone ?? 'N/A'}
Địa Chỉ: ${user.address ?? 'N/A'}
Trạng Thái: ${this.translateUserStatus(user.status)}
Đơn Hàng: ${user.orderCount ?? 0}
Trả Hàng: ${user.returnCount ?? 0}
Vi Phạm: ${violations}
Lý Do Khóa: ${user.lockReason ?? 'N/A'}`);
  }

  deleteUser(user: User): void {
    if (confirm(`Bạn có chắc muốn xóa khách hàng ${user.name}?`)) {
      this.subscriptions.add(
        this.usersService.deleteUser(user._id).subscribe({
          next: () => {
            this.users = this.users.filter(u => u._id !== user._id);
            this.filteredUsers = this.filteredUsers.filter(u => u._id !== user._id);
            this.userStats.totalUsers--;
            this.userStats.totalViolations -= (user.spamCount || 0) + (user.cancellationCount || 0) + (user.ghostingCount || 0);
            if (user.status === 'active') this.userStats.activeUsers--;
            if (user.status === 'locked') this.userStats.lockedUsers--;
            if (user.status === 'pending') this.userStats.pendingUsers--;
            alert(`Xóa khách hàng ${user.name} thành công!`);
          },
          error: (err: HttpErrorResponse) => {
            console.error('UsersComponent: Error deleting user:', err);
            alert('Lỗi khi xóa khách hàng!');
          }
        })
      );
    }
  }

  deleteSelectedUsers(): void {
    const selectedUsers = this.filteredUsers.filter(user => user.selected);
    if (selectedUsers.length === 0) {
      alert('Vui lòng chọn khách hàng để xóa.');
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa ${selectedUsers.length} khách hàng đã chọn?`)) {
      this.subscriptions.add(
        this.usersService.deleteUsers(selectedUsers.map(u => u._id)).subscribe({
          next: () => {
            this.users = this.users.filter(u => !u.selected);
            this.filteredUsers = this.filteredUsers.filter(u => !u.selected);
            this.userStats.totalUsers -= selectedUsers.length;
            this.userStats.totalViolations -= selectedUsers.reduce((sum, user) =>
              sum + (user.spamCount || 0) + (user.cancellationCount || 0) + (user.ghostingCount || 0), 0);
            this.userStats.activeUsers -= selectedUsers.filter(u => u.status === 'active').length;
            this.userStats.lockedUsers -= selectedUsers.filter(u => u.status === 'locked').length;
            this.userStats.pendingUsers -= selectedUsers.filter(u => u.status === 'pending').length;
            this.hasSelectedUsers = false;
            this.selectAll = false;
            alert('Xóa khách hàng thành công!');
          },
          error: (err: HttpErrorResponse) => {
            console.error('UsersComponent: Error deleting users:', err);
            alert('Lỗi khi xóa khách hàng!');
          }
        })
      );
    }
  }

  filterUsersByStatus(status: string): void {
    this.filteredUsers = this.users.filter(user => user.status.toLowerCase().includes(status.toLowerCase()));
    if (this.filteredUsers.length === 0) {
      alert('Không tìm thấy khách hàng với trạng thái này. Hiển thị tất cả khách hàng.');
      this.filteredUsers = [...this.users];
    } else {
      alert(`Hiển thị ${this.filteredUsers.length} khách hàng với trạng thái: ${this.translateUserStatus(status)}`);
    }
    this.selectAll = false;
    this.hasSelectedUsers = false;
  }

  getViolationDetails(user: User): string {
    const violations = [];
    if (user.spamCount > 0) violations.push(`Spam: ${user.spamCount}`);
    if (user.cancellationCount > 0) violations.push(`Hủy Đơn: ${user.cancellationCount}`);
    if (user.ghostingCount > 0) violations.push(`Bom Hàng: ${user.ghostingCount}`);
    if (user.lockReason) violations.push(`Lý Do Khóa: ${user.lockReason}`);
    return violations.length > 0 ? violations.join(', ') : 'Không có';
  }

  translateUserStatus(status: string): string {
    switch (status) {
      case 'active': return 'Hoạt Động';
      case 'locked': return 'Bị Khóa';
      case 'pending': return 'Đang Chờ';
      default: return status;
    }
  }

  applyFilters(): void {
    this.filteredCategories = this.categories.filter(category =>
      (category.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
       category.code.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (this.statusFilter ? category.status === this.statusFilter : true)
    );
    this.updateStats();
  }

  updateStats(): void {
    // Example: recalculate userStats based on filteredUsers
    this.userStats.totalUsers = this.filteredUsers.length;
    this.userStats.activeUsers = this.filteredUsers.filter(u => u.status === 'active').length;
    this.userStats.lockedUsers = this.filteredUsers.filter(u => u.status === 'locked').length;
    this.userStats.pendingUsers = this.filteredUsers.filter(u => u.status === 'pending').length;
    this.userStats.totalViolations = this.filteredUsers.reduce((sum, user) =>
      sum + (user.spamCount || 0) + (user.cancellationCount || 0) + (user.ghostingCount || 0), 0);
  }

    resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }
  openUsersModal(event: Event): void {
    event.preventDefault();
    this.isUsersModalOpen = true;
  }

  closeUsersModal(): void {
    this.isUsersModalOpen = false;
    this.selectAll = false;
    this.filteredUsers.forEach(user => user.selected = false);
    this.hasSelectedUsers = false;
  }

  toggleSelectAll(): void {
    this.filteredUsers.forEach(user => user.selected = this.selectAll);
    this.updateSelectedUsers();
  }

  updateSelectedUsers(): void {
    this.hasSelectedUsers = this.filteredUsers.some(user => user.selected);
    this.selectAll = this.filteredUsers.every(user => user.selected);
  }

  openSettings(): void {
    alert('Chức năng cài đặt đang được phát triển!');
  }

  exportUsers(): void {
    const headers = ['Tên Khách Hàng', 'Email', 'Số Điện Thoại', 'Địa Chỉ', 'Trạng Thái', 'Vi Phạm', 'Sản Phẩm'];
    const rows = this.users.map(user => [
      user.name,
      user.email,
      user.phone || 'N/A',
      user.address || 'N/A',
      this.translateUserStatus(user.status),
      this.getViolationDetails(user) || 'Không có',
      user.products?.map(p => `${p.name} (${p.status})`).join('; ') || 'Không có sản phẩm'
    ].map(field => `"${field}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Xuất dữ liệu khách hàng thành công!');
  }

  trackByUserId(user: User): string {
    return user._id;
  }
  logout(): void {
      localStorage.removeItem('authToken');
      alert('Đăng xuất thành công!');
      this.router.navigate(['/login']);
    }

    viewAllCategories(event: Event): void {
      event.preventDefault();
      this.resetFilters();
    }

    translateStatus(status: string): string {
      const statusMap: { [key: string]: string } = {
        active: 'Hoạt Động',
        inactive: 'Không Hoạt Động'
      };
      return statusMap[status] || status;
    }

    trackByUsersId(_index: number, users: User): string {
      return users._id;
    }
}
