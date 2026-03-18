export interface Category {
  _id?: string; // 🔥 PHẢI OPTIONAL
  ten: string;
  slug?: string;
  hinh?: string;
  code: string;
  parent?: string | null;
  trangthai: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}
