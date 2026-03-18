export interface Order {
  _id: string;
  date: string;
  status: 'Chờ xử lý' | 'Đang ship' | 'Hoàn Thành' | 'Đã Huỷ bỏ';
  total: number;
}
