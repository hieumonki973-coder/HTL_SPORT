import { Variant } from './variant';
import { Category } from './category';
export interface ProductCategory {
  id_sanpham: string;
  id_danhmuc: string | { _id: string };
}
export interface ProductImage {
  _id?: string;
  url: string;
  id_bienthe?: string | { _id: string };
}
export interface Product {
  _id: string;
  ten: string;
  mota: string;
  slug: string;
  ten_loai: string;
  dm_sp?: ProductCategory[];

  bienthe: Variant[];

  selectedVariantId?: string;

  hinh?: ProductImage[];
  displayImage?: string;      // 👈 ảnh đại diện

  ratingAvg?: number;
  ratingCount?: number;

  soldCount?: number;         // 👈 lượt bán
  viewCount?: number;         // 👈 lượt xem

  minPrice?: number;          // 👈 giá thấp nhất
  maxPrice?: number;

  featuredScore?: number;     // 👈 điểm nổi bật (BE tính)

  createdAt: string;
}


