

import { Category } from './category.model';
import { BienThe } from './variant.model';
export interface Product {
  _id: string;
  ten: string;
  slug?: string;
  desc?: string;
  hinh: string[];
  categories: Category[];
  bienthe: BienThe[];
  deleted_at?: string | null;

  createdAt?: string;
  updatedAt?: string;

  /** FE only */
  selected?: boolean;
  priceMin?: number;
}
export { BienThe, Category };

