const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: String }
    }
  ],
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String }
  },
  amount: { type: Number, required: true },
  payment: { type: String, default: 'momo_test' },
  status: { type: String, default: 'Chờ xử lý' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);