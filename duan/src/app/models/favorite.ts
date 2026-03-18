export interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  productId: string;
}

export interface Favorite {
  _id: string;        // id của favorite trong MongoDB
  userId: string;     // id người dùng
  productId: Product; // thông tin sản phẩm yêu thích
}
