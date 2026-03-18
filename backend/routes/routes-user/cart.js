const express = require('express');
const router = express.Router();

const gioHangController = require('../../controllers/controllers-user/cart');
const auth = require('../../controllers/controllers-user/middlewareCon');

// Tất cả route yêu cầu auth
router.use(auth.varifyToken);

// Thêm vào giỏ
router.post('/add', gioHangController.addToCart);

// Lấy giỏ hàng
router.get('/', gioHangController.getUserCart);

// Xóa 1 item
router.delete('/remove/:id_bienthe', gioHangController.removeFromCart);

// Giảm 1 đơn vị
router.put('/decrease/:id_bienthe', gioHangController.decreaseFromCart);

// Cập nhật số lượng
router.put('/update/:id_bienthe', gioHangController.updateQuantity);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', gioHangController.clearCart);

module.exports = router;