import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { OrderService, Order } from '../services/orders.service';
import { Subscription } from 'rxjs';

type DisplayOrder = Order & { productName: string; customerName: string };

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: DisplayOrder[] = [];
  filteredOrders: DisplayOrder[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  startDate: string = '';
  endDate: string = '';
  totalOrders: number = 0;
  pendingOrders: number = 0;
  shippingOrders: number = 0;
  completedOrders: number = 0;
  isLoading: boolean = true;
  errorMessage: string = '';
  sidebarToggle: boolean = false;

  // Modal states
  showModal: boolean = false;
  showEditModal: boolean = false;
  selectedOrder: DisplayOrder | null = null;
  editingOrder: DisplayOrder | null = null;
  isSaving: boolean = false;

  // Thêm biến để track trạng thái đang cập nhật
  private updatingOrders = new Map<string, string>();
  private pendingStatusUpdates = new Map<string, { status: string; timestamp: number }>();

  private subscriptions: Subscription = new Subscription();

  constructor(
    private orderService: OrderService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadPendingUpdates();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.saveFilters();
    this.subscriptions.unsubscribe();
  }

  // Lưu và khôi phục filters
  private loadSavedFilters(): void {
    const savedFilters = localStorage.getItem('order_filters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        this.searchTerm = filters.searchTerm || '';
        this.statusFilter = filters.statusFilter || '';
        this.startDate = filters.startDate || '';
        this.endDate = filters.endDate || '';
      } catch (error) {
        console.warn('Error loading saved filters:', error);
      }
    }
  }

  private saveFilters(): void {
    const filters = {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      startDate: this.startDate,
      endDate: this.endDate
    };
    localStorage.setItem('order_filters', JSON.stringify(filters));
  }

  // Lưu và khôi phục pending updates
  private loadPendingUpdates(): void {
    const saved = localStorage.getItem('pending_order_updates');
    if (saved) {
      try {
        const updates = JSON.parse(saved);
        const now = Date.now();
        // Chỉ khôi phục các update trong vòng 5 phút
        Object.entries(updates).forEach(([orderId, data]: [string, any]) => {
          if (now - data.timestamp < 5 * 60 * 1000) {
            this.pendingStatusUpdates.set(orderId, data);
          }
        });
      } catch (error) {
        console.warn('Error loading pending updates:', error);
      }
    }
  }

  private savePendingUpdates(): void {
    const updates: any = {};
    this.pendingStatusUpdates.forEach((data, orderId) => {
      updates[orderId] = data;
    });
    localStorage.setItem('pending_order_updates', JSON.stringify(updates));
  }
  getProductImage(cartItem: any): string {
    if (!cartItem) return 'assets/img/no-image.png';

    let imageUrl = '';

    if (cartItem.image) {
      if (Array.isArray(cartItem.image)) {
        imageUrl = cartItem.image[0];
      } else {
        imageUrl = cartItem.image;
      }
    }

    if (!imageUrl) return 'assets/img/no-image.png';

    if (imageUrl.startsWith('assets/')) return imageUrl; // ảnh local
    if (imageUrl.startsWith('http')) return imageUrl;   // ảnh online

    if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads')) {
      const cleanPath = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
      return `https://backend-funsport-6e9i.onrender.com${cleanPath}`;
    }

    return 'assets/img/no-image.png';
  }


  getDefaultImage(): string {
    // SVG placeholder đẹp hơn với màu sắc phù hợp
    return 'data:image/svg+xml;base64,' + btoa(`
<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#f8f9fa" rx="8"/>
        <rect x="20" y="20" width="60" height="40" fill="#e9ecef" rx="4"/>
        <circle cx="30" cy="30" r="4" fill="#adb5bd"/>
        <path d="M20 50L35 35L50 45L65 30L80 45V60H20V50Z" fill="#6c757d"/>
        <rect x="25" y="70" width="50" height="4" fill="#dee2e6" rx="2"/>
        <rect x="25" y="78" width="35" height="4" fill="#dee2e6" rx="2"/>
      </svg>
    `);
  }

  // Thêm method để debug hình ảnh
  debugImageInfo(item: any): void {
    console.log('Debug image info for item:', {
      item: item,
      image: item?.image,
      imageType: typeof item?.image,
      isArray: Array.isArray(item?.image),
      images: item?.images,
      thumbnail: item?.thumbnail,
      photo: item?.photo
    });
  }

  onImageError(event: any): void {
    console.warn('Image load failed:', event.target.src);

    // Thử các URL backup trước khi dùng default image
    const currentSrc = event.target.src;
    const originalSrc = event.target.getAttribute('data-original-src');

    if (!originalSrc) {
      // Lưu src gốc để tránh infinite loop
      event.target.setAttribute('data-original-src', currentSrc);

      // Thử các URL khác nhau
      if (currentSrc.includes('/uploads/')) {
        // Thử bỏ /uploads/
        const fileName = currentSrc.split('/uploads/')[1];
        event.target.src = `https://backend-funsport-6e9i.onrender.com/${fileName}`;
        return;
      } else if (!currentSrc.includes('/uploads/')) {
        // Thử thêm /uploads/
        const fileName = currentSrc.split('/').pop();
        event.target.src = `https://backend-funsport-6e9i.onrender.com/uploads/${fileName}`;
        return;
      }
    }

    // Nếu tất cả đều fail, dùng default image
    event.target.src = this.getDefaultImage();
    event.target.classList.add('image-error');
    event.target.setAttribute('data-image-failed', 'true');
  }

  onImageLoad(event: any): void {
    event.target.classList.add('image-loaded');
    event.target.classList.remove('image-error');
    console.log('Image loaded successfully:', event.target.src);
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'fas fa-clock',
      'inprogress': 'fas fa-spinner fa-spin',
      'delivered': 'fas fa-check-circle',
      'return': 'fas fa-times-circle',
      'cancelled': 'fas fa-ban'
    };
    return statusIcons[status?.toLowerCase()] || 'fas fa-question-circle';
  }

  loadData(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.orderService.getOrders().subscribe({
        next: (orders: Order[]) => {
          console.log('Raw orders data:', orders); // Debug log

          this.orders = (orders ?? []).map(order => {
            // Debug log cho từng order
            if (order.cartItems && order.cartItems.length > 0) {
              console.log(`Order ${order.orderId} cart items:`, order.cartItems);
            }

            // Áp dụng pending updates nếu có
            const pendingUpdate = this.pendingStatusUpdates.get(order.orderId);
            const finalOrder = pendingUpdate ? { ...order, status: pendingUpdate.status } : order;

            return {
              ...finalOrder,
              productName: (finalOrder?.cartItems ?? []).map((ci: any) => ci?.name).join(', ') || 'N/A',
              customerName: finalOrder?.customerInfo?.fullName || 'N/A'
            } as DisplayOrder;
          });

          // Xóa các pending updates đã được confirm từ server
          this.orders.forEach(order => {
            const pendingUpdate = this.pendingStatusUpdates.get(order.orderId);
            if (pendingUpdate && pendingUpdate.status === order.status) {
              this.pendingStatusUpdates.delete(order.orderId);
            }
          });

          this.updateStatistics();
          this.filteredOrders = [...this.orders];
          this.applyFilters();
          this.isLoading = false;
          this.savePendingUpdates();

          console.log('OrdersComponent: Data loaded:', this.orders);

          // Debug: Log first few images
          this.orders.slice(0, 3).forEach((order, index) => {
            if (order.cartItems && order.cartItems.length > 0) {
              console.log(`Order ${index + 1} first item image:`, {
                orderId: order.orderId,
                item: order.cartItems[0],
                processedUrl: this.getProductImage(order.cartItems[0])
              });
            }
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('OrdersComponent: Error loading data:', err);
          this.errorMessage = 'Lỗi khi tải dữ liệu';
          this.isLoading = false;
        }
      })
    );
  }

  private updateStatistics(): void {
    this.totalOrders = this.orders.length;
    this.pendingOrders = this.orders.filter(o => o.status?.toLowerCase() === 'pending').length;
    this.shippingOrders = this.orders.filter(o => o.status?.toLowerCase() === 'inprogress').length;
    this.completedOrders = this.orders.filter(o => o.status?.toLowerCase() === 'delivered').length;
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = this.searchTerm
        ? order.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.orderId?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      const matchesStatus = this.statusFilter
        ? order.status?.toLowerCase() === this.statusFilter.toLowerCase()
        : true;

      const orderDate = new Date(order.createdAt);
      const matchesStartDate = this.startDate
        ? orderDate >= new Date(this.startDate)
        : true;
      const matchesEndDate = this.endDate
        ? orderDate <= new Date(this.endDate)
        : true;

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });

    // Lưu filters
    this.saveFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.startDate = '';
    this.endDate = '';
    localStorage.removeItem('order_filters');
    this.applyFilters();
  }

  exportOrders(): void {
    const headers = [
      'Mã Đơn Hàng',
      'Tên Sản Phẩm',
      'Khách Hàng',
      'Số Điện Thoại',
      'Email',
      'Địa Chỉ',
      'Tổng Tiền',
      'Phương Thức Thanh Toán',
      'Trạng Thái',
      'Ngày Tạo',
      'Ghi Chú'
    ];

    const rows = this.filteredOrders.map(order => [
      order.orderId,
      order.productName,
      order.customerName,
      order.customerInfo?.phone || 'N/A',
      order.customerInfo?.email || 'N/A',
      order.customerInfo?.address || 'N/A',
      (order.amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      order.payment || 'N/A',
      this.translateStatus(order.status),
      new Date(order.createdAt).toLocaleDateString('vi-VN'),
      order.notes || 'N/A'
    ].map(field => `"${field}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showSuccessMessage('Xuất dữ liệu đơn hàng thành công!');
  }

  viewOrderDetails(order: DisplayOrder): void {
    this.selectedOrder = order;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedOrder = null;
  }

  editOrder(order: DisplayOrder): void {
    this.editingOrder = this.deepCopyOrder(order);
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingOrder = null;
    this.isSaving = false;
  }

  private deepCopyOrder(order: DisplayOrder): DisplayOrder {
    return {
      ...order,
      customerInfo: { ...order.customerInfo },
      cartItems: order.cartItems.map(item => ({ ...item }))
    };
  }

  addCartItem(): void {
    if (this.editingOrder) {
      this.editingOrder.cartItems.push({
        name: '',
        price: 0,
        quantity: 1,
        image: ''
      });
    }
  }

  removeCartItem(index: number): void {
    if (this.editingOrder && this.editingOrder.cartItems.length > 1) {
      this.editingOrder.cartItems.splice(index, 1);
      this.calculateTotal();
    } else {
      alert('Đơn hàng phải có ít nhất một sản phẩm');
    }
  }

  calculateTotal(): void {
    if (this.editingOrder) {
      this.editingOrder.amount = this.editingOrder.cartItems.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
      );
    }
  }

  saveOrderChanges(): void {
    if (!this.editingOrder) return;

    if (!this.validateOrderData(this.editingOrder)) {
      return;
    }

    this.isSaving = true;

    const sanitizedCartItems = this.editingOrder.cartItems.map(item => ({
      ...item,
      image: Array.isArray(item.image) ? item.image[0] : item.image || ''
    }));

    const updateData = {
      customerInfo: this.editingOrder.customerInfo,
      cartItems: sanitizedCartItems,
      amount: this.editingOrder.amount,
      payment: this.editingOrder.payment,
      status: this.editingOrder.status,
      shippingMethod: this.editingOrder.shippingMethod,
      notes: this.editingOrder.notes
    };

    // Lưu trạng thái tạm thời
    this.pendingStatusUpdates.set(this.editingOrder.orderId, {
      status: this.editingOrder.status,
      timestamp: Date.now()
    });
    this.savePendingUpdates();

    this.subscriptions.add(
      this.orderService.updateOrder(this.editingOrder.orderId, updateData).subscribe({
        next: (updatedOrder: Order) => {
          console.log('Order updated successfully:', updatedOrder);

          // Xóa pending update khi thành công
          this.pendingStatusUpdates.delete(this.editingOrder!.orderId);
          this.savePendingUpdates();

          const orderIndex = this.orders.findIndex(o => o.orderId === this.editingOrder!.orderId);
          if (orderIndex !== -1) {
            this.orders[orderIndex] = {
              ...this.orders[orderIndex],
              ...updatedOrder,
              productName: (updatedOrder?.cartItems ?? []).map((ci: any) => ci?.name).join(', ') || 'N/A',
              customerName: updatedOrder?.customerInfo?.fullName || 'N/A'
            } as DisplayOrder;
          }

          this.updateStatistics();
          this.applyFilters();
          this.closeEditModal();
          this.showSuccessMessage('Cập nhật đơn hàng thành công!');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error updating order:', err);
          // Giữ lại pending update để retry sau
          this.showErrorMessage('Lỗi khi cập nhật đơn hàng: ' + (err.error?.message || err.message));
          this.isSaving = false;
        }
      })
    );
  }

updateOrderStatus(orderId: string, newStatus: string): void {
  console.log('[Component] updateOrderStatus CALLED');
  console.log('[Component] Input orderId:', orderId);
  console.log('[Component] Input newStatus:', newStatus);

  const orderIndex = this.orders.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) {
    console.error('[Component] Order not found:', orderId);
    this.showErrorMessage('Không tìm thấy đơn hàng');
    return;
  }

  const order = this.orders[orderIndex];
  const identifier = order._id || order.orderId; // ưu tiên _id
  const currentStatus = order.status?.toLowerCase();

  console.log('[Component] Current order object:', order);
  console.log('[Component] identifier used for API call:', identifier);
  console.log('[Component] currentStatus:', currentStatus);

  // ❌ Không cho đổi nếu đã returned hoặc cancelled
  if ((currentStatus === 'returned' || currentStatus === 'cancelled')
      && currentStatus !== newStatus) {
    console.warn('[Component] Update blocked: order already', currentStatus);
    this.showErrorMessage('Không thể cập nhật trạng thái cho đơn hàng đã hủy hoặc đã trả hàng');
    return;
  }

 // ❌ Nếu đơn đã hủy, trả hàng hoặc đã giao thì không cho đổi nữa
  if (['cancelled', 'returned', 'delivered'].includes(currentStatus)
      && currentStatus !== newStatus) {
    console.warn(`[Component] Update blocked: order already ${currentStatus}`);
    this.showErrorMessage(
      currentStatus === 'cancelled'
        ? 'Không thể cập nhật trạng thái cho đơn hàng đã hủy'
        : currentStatus === 'returned'
          ? 'Không thể cập nhật trạng thái cho đơn hàng đã trả hàng'
          : 'Không thể cập nhật trạng thái cho đơn hàng đã giao'
    );
    return;
  }

  // ❌ Không cho quay ngược về pending
  if (currentStatus === 'inprogress' && newStatus === 'pending') {
    console.warn('[Component] Invalid transition inprogress -> pending');
    this.showErrorMessage('Không thể chuyển từ đang xử lý về chờ xử lý');
    return;
  }

  // ⏳ Tránh double update
  if (this.updatingOrders.has(orderId)) {
    console.warn('[Component] Update already in progress for:', orderId);
    return;
  }
  this.updatingOrders.set(orderId, newStatus);

  // ✅ Optimistic UI update
  const oldStatus = currentStatus;
  order.status = newStatus;
  this.updateStatistics();
  this.applyFilters();

  console.log(`[Component] 🚀 Sending API request to update order ${identifier}: ${oldStatus} -> ${newStatus}`);

  this.subscriptions.add(
    this.orderService.updateOrder(identifier, { status: newStatus }).subscribe({
      next: (updatedOrder: Order) => {
        console.log(`[Component] ✅ Successfully updated order ${identifier}`, updatedOrder);

        // Reset flags
        this.updatingOrders.delete(orderId);

        if (updatedOrder) {
          this.orders[orderIndex] = {
            ...order,
            ...updatedOrder,
            productName: order.productName,
            customerName: order.customerName
          };
          this.updateStatistics();
          this.applyFilters();
          this.showSuccessMessage(`Cập nhật trạng thái đơn hàng ${orderId} thành ${this.translateStatus(newStatus)}`);
        }
      },
      error: (err) => {
        console.error('[Component] ❌ Error updating status:', err);
        order.status = oldStatus; // rollback nếu lỗi
        this.updatingOrders.delete(orderId);
        this.updateStatistics();
        this.applyFilters();
        this.showErrorMessage('Lỗi khi cập nhật trạng thái đơn hàng: ' + (err.error?.message || err.message));
      }
    })
  );
}

  // Thêm method để retry pending updates
  retryPendingUpdates(): void {
    if (this.pendingStatusUpdates.size === 0) return;

    console.log('Retrying pending updates:', this.pendingStatusUpdates);

    this.pendingStatusUpdates.forEach((data, orderId) => {
      // Retry nếu update cũ hơn 30 giây
      if (Date.now() - data.timestamp > 30000) {
        this.updateOrderStatus(orderId, data.status);
      }
    });
  }

  private validateOrderData(order: DisplayOrder): boolean {
    if (!order.customerInfo?.fullName?.trim()) {
      this.showErrorMessage('Tên khách hàng không được để trống');
      return false;
    }

    if (!order.customerInfo?.phone?.trim()) {
      this.showErrorMessage('Số điện thoại không được để trống');
      return false;
    }

    if (!order.customerInfo?.email?.trim() || !this.isValidEmail(order.customerInfo.email)) {
      this.showErrorMessage('Email không hợp lệ');
      return false;
    }

    if (!order.cartItems || order.cartItems.length === 0) {
      this.showErrorMessage('Đơn hàng phải có ít nhất một sản phẩm');
      return false;
    }

    for (let i = 0; i < order.cartItems.length; i++) {
      const item = order.cartItems[i];
      if (!item.name?.trim()) {
        this.showErrorMessage(`Tên sản phẩm ${i + 1} không được để trống`);
        return false;
      }
      if (item.quantity <= 0) {
        this.showErrorMessage(`Số lượng sản phẩm ${i + 1} phải lớn hơn 0`);
        return false;
      }
      if (item.price < 0) {
        this.showErrorMessage(`Giá sản phẩm ${i + 1} không được âm`);
        return false;
      }
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showSuccessMessage(message: string): void {
    alert(message);
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  deleteOrder(order: Order): void {
    if (!this.canDeleteOrder(order)) {
      this.showErrorMessage('Chỉ có thể xóa đơn hàng ở trạng thái chờ xử lý hoặc đã hủy');
      return;
    }

    if (confirm(`Bạn có chắc muốn xóa đơn hàng ${order.orderId}?`)) {
      if (order.status === 'pending') {
        this.updateOrderStatus(order.orderId, 'cancelled');
      } else if (order.status === 'cancelled') {
        this.subscriptions.add(
          this.orderService.deleteOrder(order.orderId).subscribe({
            next: () => {
              this.orders = this.orders.filter(o => o.orderId !== order.orderId);
              this.updateStatistics();
              this.applyFilters();
              this.showSuccessMessage('Xóa đơn hàng thành công!');
            },
            error: (err: HttpErrorResponse) => {
              console.error('OrdersComponent: Error deleting order:', err);
              this.showErrorMessage('Lỗi khi xóa đơn hàng');
            }
          })
        );
      }
    }
  }

  canDeleteOrder(order: Order): boolean {
    return ['pending', 'cancelled'].includes(order.status?.toLowerCase());
  }
  trackByOrderId(_: number, order: Order): string {
    return order.orderId;
  }

  translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ xử lý',
      'inprogress': 'Đang xử lý',
      'paid': 'Đã thanh toán',
      'failed': 'Thanh toán thất bại',
      'delivered': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'returned': 'Đã trả hàng'
    };
    return statusMap[status?.toLowerCase()] || status;
  }

  getAvailableStatuses(currentStatus: string): Array<{ value: string, label: string }> {
    const statuses = [
      { value: 'pending', label: 'Chờ xử lý' },
      { value: 'inprogress', label: 'Đang xử lý' },
      { value: 'delivered', label: 'Hoàn thành' },
      { value: 'cancelled', label: 'Đã hủy' },
      { value: 'returned', label: 'Đã trả hàng' }
    ];

    if (currentStatus.toLowerCase() === 'inprogress') {
      return statuses.filter(status => status.value !== 'pending');
    }
    return statuses;
  }
  logout(): void {
    // Clear all cached data
    localStorage.removeItem('authToken');
    localStorage.removeItem('order_filters');
    localStorage.removeItem('pending_order_updates');
    alert('Đăng xuất thành công!');
    this.router.navigate(['/login']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canEditOrder(order: Order): boolean {
    return ['pending', 'inprogress'].includes(order.status?.toLowerCase());
  }

  canCancelOrder(order: Order): boolean {
    return ['pending', 'inprogress'].includes(order.status?.toLowerCase());
  }



  markAsProcessing(order: DisplayOrder): void {
    this.updateOrderStatus(order.orderId, 'inprogress');
  }

  markAsDelivered(order: DisplayOrder): void {
    this.updateOrderStatus(order.orderId, 'delivered');
  }

  markAsCancelled(order: DisplayOrder): void {
    if (confirm(`Bạn có chắc muốn hủy đơn hàng ${order.orderId}?`)) {
      this.updateOrderStatus(order.orderId, 'cancelled');
    }
  }

  selectedOrderIds: string[] = [];

  toggleOrderSelection(orderId: string): void {
    const index = this.selectedOrderIds.indexOf(orderId);
    if (index > -1) {
      this.selectedOrderIds.splice(index, 1);
    } else {
      this.selectedOrderIds.push(orderId);
    }
  }

  selectAllOrders(): void {
    this.selectedOrderIds = this.filteredOrders.map(order => order.orderId);
  }
  clearSelection(): void {
    this.selectedOrderIds = [];
  }

  bulkUpdateStatus(newStatus: string): void {
    if (this.selectedOrderIds.length === 0) {
      this.showErrorMessage('Vui lòng chọn ít nhất một đơn hàng');
      return;
    }

    const invalidOrders = this.orders
      .filter(o => this.selectedOrderIds.includes(o.orderId) && o.status.toLowerCase() === 'inprogress' && newStatus === 'pending');
    if (invalidOrders.length > 0) {
      this.showErrorMessage('Không thể cập nhật trạng thái từ đang xử lý về chờ xử lý cho một số đơn hàng');
      return;
    }

    if (confirm(`Bạn có chắc muốn cập nhật trạng thái ${this.selectedOrderIds.length} đơn hàng?`)) {
      this.selectedOrderIds.forEach(orderId => {
        this.updateOrderStatus(orderId, newStatus);
      });
      this.clearSelection();
    }
  }

  viewAllOrders(event: Event): void {
    event.preventDefault();
    this.resetFilters();
    this.showSuccessMessage('Đang hiển thị tất cả đơn hàng');
  }

  navigateToOrderDetail(orderId: string): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  navigateToCustomer(customerId: string): void {
    if (customerId) {
      this.router.navigate(['/admin/customers', customerId]);
    }
  }

  navigateToProduct(productId: string): void {
    if (productId) {
      this.router.navigate(['/admin/products', productId]);
    }
  }
}
