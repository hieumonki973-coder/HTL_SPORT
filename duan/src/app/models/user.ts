export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  status: 'Hoạt động' | 'Không hoạt động';
}
