import { Product } from './product';
import { Variant } from './variant';

export interface ProductImage {
  _id?: string;  // ID của hình ảnh
  url: string;
  id_bienthe?: string | { _id: string };
}

export interface CartItem {
  _id?: string;
  id_sanpham: string | Product;
  id_bienthe: string | Variant;
  soluong: number;

  product?: Product;
  variant?: Variant;

  // ✅ Thêm field để quản lý checkbox selection
  selected?: boolean;
}
