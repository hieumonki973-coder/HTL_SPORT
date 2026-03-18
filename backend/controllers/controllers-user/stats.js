const Order = require('../../model/order');
const { product: Product } = require('../../model/model');


exports.getStats = async (req, res) => {
  try {
    // Lấy tất cả đơn hàng
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = orders.length;

    // Lấy tổng số sản phẩm
    const totalProducts = await Product.countDocuments();

    // Giả lập tăng trưởng (có thể thay bằng logic thật)
    const revenueGrowth = 18; // %
    const orderGrowth = 12; // %

    // Tính % đơn hàng trên tổng (orders + products)
    const percentageSold = Math.min(
      (totalOrders / (totalOrders + totalProducts)) * 100,
      100
    ).toFixed(2);

    res.status(200).json({
      totalRevenue,
      revenueGrowth,
      totalOrders,
      totalProducts,
      orderGrowth,
      percentageSold: Number(percentageSold),
    });
  } catch (err) {
    console.error('❌ Lỗi khi lấy thống kê:', err);
    res.status(500).json({ message: 'Không thể lấy dữ liệu thống kê' });
  }
};
