import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { OrderService } from '../../../services/order.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { AddressPickerComponent } from '../address-picker/address-picker.component';
import { Address } from '../../../services/Address.service';

// Danh sách voucher hợp lệ — thay bằng API thực nếu có
const VALID_VOUCHERS: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
  'ASICS10':  { type: 'percent', value: 10,      label: 'Giảm 10% tổng đơn'         },
  'ASICS50K': { type: 'fixed',   value: 50000,   label: 'Giảm 50.000₫'              },
  'WELCOME':  { type: 'percent', value: 15,      label: 'Giảm 15% cho khách mới'    },
  'FREESHIP': { type: 'fixed',   value: 30000,   label: 'Miễn phí vận chuyển'       },
};

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AddressPickerComponent]
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  subtotal: number = 0;
  shippingFee: number = 30000;
  discount: number = 0;
  total: number = 0;
  checkoutForm!: FormGroup;
  isLoading: boolean = false;
  user: any;

  // ── Voucher state ──
  voucherCode: string = '';
  voucherError: string = '';
  isApplyingVoucher: boolean = false;
  appliedVoucher: { code: string; label: string; type: 'percent' | 'fixed'; value: number } | null = null;

  // ── Address state ──
  selectedAddress: Address | null = null;
  addressError: boolean = false;

  // ── Stock warning state ──
  outOfStockItems: { variantId: string; name: string; available: number; requested?: number }[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const resultCode = params['resultCode'];
      const orderId    = params['orderId'];
      if (resultCode === '0') {
        this.cartService.clearCart().subscribe(() => {
          localStorage.removeItem('checkoutCart');
          Swal.fire('Thành công', 'Thanh toán thành công!', 'success');
          this.router.navigate(['/home']);
        });
      } else if (resultCode) {
        Swal.fire('Thất bại', 'Thanh toán không thành công', 'error');
      }
    });

    this.user = this.authService.checkLogin();
    if (!this.user) {
      Swal.fire({ icon: 'warning', title: 'Bạn cần đăng nhập để đặt hàng', confirmButtonText: 'Đăng nhập' })
        .then(() => this.router.navigate(['/login']));
      return;
    }

    this.cartItems = this.cartService.getCheckoutCart();
    if (!this.cartItems || this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    console.log('🛒 CartItems:', this.cartItems);

    this.subtotal = this.cartItems.reduce((sum, item) => {
      const gia = item.id_bienthe?.giagoc ?? item.variant?.giagoc ?? 0;
      const sl  = item.soluong ?? 0;
      return sum + gia * sl;
    }, 0);
    this.recalcTotal();

    this.checkoutForm = this.fb.group({
      name:    [{ value: this.user.fullName || this.user.ten || '', disabled: true }, Validators.required],
      phone:   [this.user.phone || this.user.sdt || '', [Validators.required, Validators.pattern(/^(0[0-9]{9})$/)]],
      note:    ['']
    });
  }

  // ── Tính lại tổng ──────────────────────────────────────────
  private recalcTotal(): void {
    this.total = this.subtotal - this.discount + this.shippingFee;
    if (this.total < 0) this.total = 0;
  }

  // ── Voucher ────────────────────────────────────────────────
  applyVoucher(): void {
    const code = this.voucherCode.trim().toUpperCase();
    if (!code) return;

    this.voucherError     = '';
    this.isApplyingVoucher = true;

    // Giả lập delay gọi API (thay bằng http call thực nếu có)
    setTimeout(() => {
      this.isApplyingVoucher = false;
      const voucher = VALID_VOUCHERS[code];

      if (!voucher) {
        this.voucherError = 'Mã giảm giá không hợp lệ hoặc đã hết hạn.';
        // trigger animation shake
        setTimeout(() => { this.voucherError = this.voucherError; }, 10);
        return;
      }

      this.appliedVoucher = { code, ...voucher };

      if (voucher.type === 'percent') {
        this.discount = Math.round(this.subtotal * voucher.value / 100);
      } else {
        this.discount = voucher.value;
        // Nếu là FREESHIP thì free ship
        if (code === 'FREESHIP') this.shippingFee = 0;
      }

      this.recalcTotal();
      this.voucherCode = '';
    }, 600);
  }

  removeVoucher(): void {
    this.appliedVoucher = null;
    this.discount       = 0;
    this.shippingFee    = 30000;   // reset phí ship
    this.voucherCode    = '';
    this.voucherError   = '';
    this.recalcTotal();
  }

  // ── Image ──────────────────────────────────────────────────
  getImageUrl(item: any): string {
    const hinh = item.id_sanpham?.hinh;
    if (Array.isArray(hinh) && hinh.length > 0) {
      const variantId = typeof item.id_bienthe === 'object' ? item.id_bienthe?._id : item.id_bienthe;
      const matched   = hinh.find((h: any) => {
        const hBt = typeof h.id_bienthe === 'object' ? h.id_bienthe?._id : h.id_bienthe;
        return hBt === variantId;
      });
      const url = matched?.url || hinh[0]?.url;
      if (url) return url;
    }
    if (item.product?.hinh?.[0]?.url) return item.product.hinh[0].url;
    return 'assets/img/no-image.png';
  }

  getColorHex(bienthe: any): string {
    if (!bienthe) return '';
    const loai = bienthe.id_loaibienthe;
    if (typeof loai === 'object' && loai?.color) return loai.color;
    if (bienthe.color) return bienthe.color;
    return '';
  }

  // ── Address ────────────────────────────────────────────────
  onAddressSelected(addr: Address): void {
    this.selectedAddress = addr;
    this.addressError = false;
  }

  // ── Submit ─────────────────────────────────────────────────
  payWithMoMo(): void {
    this.checkoutForm.markAllAsTouched();
    this.outOfStockItems = [];

    if (!this.selectedAddress) {
      this.addressError = true;
      Swal.fire({ icon: 'warning', title: 'Thiếu địa chỉ', text: 'Vui lòng chọn hoặc thêm địa chỉ giao hàng.', confirmButtonText: 'OK' });
      return;
    }

    if (this.checkoutForm.invalid) {
      Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập đầy đủ thông tin.', confirmButtonText: 'OK' });
      return;
    }

    this.isLoading = true;

    // ── Bước 1: Kiểm tra & giữ tồn kho (atomic, chống race condition) ──
    const stockItems = this.cartItems.map(item => ({
      variantId: typeof item.id_bienthe === 'object' ? item.id_bienthe?._id : item.id_bienthe,
      quantity : item.soluong,
      name     : item.id_sanpham?.ten || item.product?.ten || 'Sản phẩm'
    }));

    this.orderService.checkStock(stockItems).subscribe({
      next : () => this._submitOrder(), // tồn kho OK → tạo đơn
      error: (err) => {
        this.isLoading = false;
        const body = err.error;

        // Gộp danh sách hết hàng + thiếu hàng
        const list = [...(body?.outOfStock || []), ...(body?.insufficient || [])];

        if (list.length > 0) {
          this.outOfStockItems = list;

          const detail = list.map((i: any) =>
            i.available === 0
              ? `• <b>${i.name}</b>: Đã hết hàng`
              : `• <b>${i.name}</b>: Chỉ còn ${i.available} (bạn chọn ${i.requested})`
          ).join('<br>');

          Swal.fire({
            icon             : 'warning',
            title            : '⚠️ Sản phẩm không đủ tồn kho',
            html             : `${detail}<br><br>Vui lòng quay lại giỏ hàng để điều chỉnh.`,
            confirmButtonText: 'Về giỏ hàng',
            showCancelButton : true,
            cancelButtonText : 'Ở lại'
          }).then(r => { if (r.isConfirmed) this.router.navigate(['/cart']); });
        } else {
          Swal.fire('Lỗi', body?.message || 'Không thể kiểm tra tồn kho.', 'error');
        }
      }
    });
  }

  // ── Bước 2: Tạo đơn + MoMo (chỉ chạy sau khi tồn kho đã được giữ) ──
  private _submitOrder(): void {
    const orderData = {
      cartItems: this.cartItems.map(item => {
        const sp = item.id_sanpham;
        const bt = item.id_bienthe;
        return {
          productId : typeof sp === 'object' ? sp._id  : sp,
          name      : sp?.ten   || '—',
          price     : bt?.giagoc ?? 0,
          variantId : typeof bt === 'object' ? bt._id  : bt,
          size      : bt?.size  || 'Freesize',
          color     : bt?.ten_mau || this.getColorHex(bt) || 'Mặc định',
          quantity  : item.soluong,
          image     : this.getImageUrl(item),
        };
      }),
      customerInfo: {
        fullName : this.selectedAddress!.fullName,
        phone    : this.selectedAddress!.phone,
        address  : [
          this.selectedAddress!.soNha,
          this.selectedAddress!.duong,
          this.selectedAddress!.phuong,
          this.selectedAddress!.quan,
          this.selectedAddress!.tinh
        ].filter(Boolean).join(', '),
        note: this.checkoutForm.get('note')?.value,
      },
      voucher : this.appliedVoucher ? { code: this.appliedVoucher.code, discount: this.discount } : null,
      amount  : this.total,
      payment : 'momo',
    };

    console.log('📦 Order gửi đi:', orderData);

    this.orderService.createOrderWithMoMo(orderData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.payUrl) {
          window.location.href = res.payUrl;
        } else {
          Swal.fire('Thành công', 'Đơn hàng đã được tạo', 'success');
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Lỗi tạo đơn hàng:', err);

        // MoMo thất bại → hoàn lại tồn kho đã giữ
        const releaseItems = this.cartItems.map(item => ({
          variantId: typeof item.id_bienthe === 'object' ? item.id_bienthe?._id : item.id_bienthe,
          quantity : item.soluong
        }));
        this.orderService.releaseStock(releaseItems).subscribe();

        Swal.fire('Lỗi', 'Không thể tạo đơn hàng. Vui lòng thử lại.', 'error');
      }
    });
  }
}
