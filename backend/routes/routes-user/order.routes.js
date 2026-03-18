const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/controllers-user/order');
console.log('orderController:', orderController);

const { varifyToken, isAdmin } = require('../../controllers/controllers-user/middlewareCon');

// ================= MoMo =================
router.post('/', varifyToken, orderController.createOrderAndPayWithMoMo);
router.post('/create-momo-test', varifyToken, orderController.createOrderAndPayWithMoMo);
router.post('/payment-notify', orderController.momoIpnHandler);

// ================= Stock (Race Condition Guard) =================
// Phải đặt TRƯỚC các route có :id để tránh bị match nhầm
router.post('/check-stock',   varifyToken, orderController.checkAndReserveStock);
router.post('/release-stock', varifyToken, orderController.releaseStock);

// ================= Stats =================
router.get('/revenue-by-category', isAdmin, orderController.getRevenueByCategory);
router.get('/revenue-by-date', isAdmin, orderController.getRevenueByDate);


// ================= Orders (User) =================
router.get('/my', varifyToken, orderController.getOrdersByUser);
router.get('/:id', varifyToken, orderController.getOrderById);
router.patch('/code/:orderId/cancel', varifyToken, orderController.cancelOrderByCode);
router.patch('/:id/cancel', varifyToken, orderController.cancelOrder);

// ================= Orders (Admin) =================
router.get('/', isAdmin, orderController.getAllOrders);  
router.put('/:id', isAdmin, orderController.updateOrder);
router.delete('/:id', isAdmin, orderController.deleteOrder);
router.patch('/:id/lock', isAdmin, orderController.toggleOrderLock);

module.exports = router;