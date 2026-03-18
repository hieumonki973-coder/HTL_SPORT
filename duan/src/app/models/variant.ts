export interface Variant {
  _id: string;
  id_sanpham: string;
  id_loaibienthe: string | {
    _id: string;
    color: string;
    ten: string;
  };
  id_size: string;
  size: string;
  color: string;
  ten_mau: string;
  giagoc: number;        // giá bán
  giaban: number; // 👈 giá gốc
  soluong: number;



}
