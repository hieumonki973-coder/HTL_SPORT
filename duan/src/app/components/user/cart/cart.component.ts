// src/app/components/cart/cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CartService } from '../../../services/cart.service';
import { CartItem } from '../../../models/cart-item.model';
import { Product, ProductImage } from '../../../models/product';
import { Variant } from '../../../models/variant';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  imports: [CommonModule, DecimalPipe, RouterModule, FormsModule]
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  stockWarnings: { [vid: string]: string } = {};

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
    localStorage.removeItem('checkoutCart');
  }

  loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (res: any) => {
        const rawItems = Array.isArray(res) ? res : (res?.items || []);

        this.cartItems = rawItems.map((raw: any) => {
          const productData = raw.sanpham || raw.id_sanpham;
          const variantData = raw.bienthe || raw.id_bienthe;

          return {
            _id: raw._id,
            id_sanpham: typeof raw.id_sanpham === 'string' ? raw.id_sanpham : (productData?._id || ''),
            id_bienthe: typeof raw.id_bienthe === 'string' ? raw.id_bienthe : (variantData?._id || ''),
            soluong: raw.soluong || 1,
            product: productData && typeof productData === 'object' ? productData : undefined,
            variant: variantData && typeof variantData === 'object' ? variantData : undefined,
            selected: false
          } as CartItem;
        });

        this.cartService.updateCartCount(this.cartItems);
      },
      error: (err) => console.error('Lỗi lấy giỏ hàng:', err)
    });
  }

  // ================= CÁC HÀM CÒN LẠI (đã tối ưu) =================
  removeItem(item: CartItem): void {
    if (!confirm('Xóa sản phẩm này?')) return;
    const vid = this.getVariantId(item);
    if (vid) this.cartService.removeFromCart(vid).subscribe(() => this.loadCart());
  }

  increase(item: CartItem): void {
    const pid = this.getProductId(item);
    const vid = this.getVariantId(item);
    const stock = item.variant?.soluong ?? Infinity;

    if (item.soluong >= stock) {
      if (vid) this.stockWarnings[vid] = `Chỉ còn ${stock} sản phẩm trong kho`;
      return;
    }

    if (pid && vid) {
      this.cartService.addToCart({ id_sanpham: pid, id_bienthe: vid, soluong: 1 })
        .subscribe(() => this.loadCart());
    }
  }

  decrease(item: CartItem): void {
    const vid = this.getVariantId(item);
    if (vid) {
      delete this.stockWarnings[vid];
      this.cartService.decreaseQuantity(vid).subscribe(() => this.loadCart());
    }
  }

  removeSelectedItems(): void {
    const selected = this.cartItems.filter(i => i.selected);
    if (selected.length === 0) return alert('Chọn ít nhất 1 sản phẩm');
    if (!confirm(`Xóa ${selected.length} sản phẩm?`)) return;

    Promise.all(selected.map(item => {
      const vid = this.getVariantId(item);
      return vid ? this.cartService.removeFromCart(vid).toPromise() : Promise.resolve();
    })).then(() => this.loadCart());
  }

  goToCheckout(): void {
    const selected = this.cartItems.filter(i => i.selected);
    if (selected.length === 0) return alert('Chọn ít nhất 1 sản phẩm');
    this.cartService.setCheckoutCart(selected);
    this.router.navigate(['/checkout']);
  }

  // ================= DISPLAY HELPERS =================
  getVariantPrice(item: CartItem): number {
    return item.variant?.giagoc ?? item.variant?.giagoc ?? 0;
  }

  getSize(item: CartItem): string {
    return item.variant?.size || '—';
  }

  getColor(item: CartItem): string {
    return item.variant?.color || item.variant?.ten_mau || '—';
  }

  getItemImage(item: CartItem): string {
    const product = item.product;
    if (!product?.hinh?.length) return 'assets/img/no-image.png';

    const vid = this.getVariantId(item);
    if (vid) {
      const img = product.hinh.find((i: ProductImage) => {
        const imgVid = typeof i.id_bienthe === 'string' ? i.id_bienthe : i.id_bienthe?._id;
        return imgVid === vid;
      });
      if (img?.url) return img.url;
    }
    return product.hinh[0].url;
  }

  private getProductId(item: CartItem): string {
    return typeof item.id_sanpham === 'string' ? item.id_sanpham : item.id_sanpham?._id || '';
  }

  private getVariantId(item: CartItem | any): string {
    return typeof item.id_bienthe === 'string' ? item.id_bienthe : item.id_bienthe?._id || '';
  }

  // Selection methods (giữ nguyên)
  toggleSelectAll(e: Event) { const checked = (e.target as HTMLInputElement).checked; this.cartItems.forEach(i => i.selected = checked); }
  isAllSelected() { return this.cartItems.length > 0 && this.cartItems.every(i => i.selected); }
  getSelectedCount() { return this.cartItems.filter(i => i.selected).length; }
  getSelectedTotal() { return this.cartItems.filter(i => i.selected).reduce((sum, i) => sum + this.getVariantPrice(i) * i.soluong, 0); }
  getShippingFee() { return this.getSelectedTotal() >= 500000 ? 0 : 0; }
}
