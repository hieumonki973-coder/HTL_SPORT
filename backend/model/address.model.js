const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'account',
      required: true
    },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    tinh: { type: String, required: true },    // Tỉnh / Thành phố
    quan: { type: String, required: true },    // Quận / Huyện
    phuong: { type: String, required: true },  // Phường / Xã
    duong: { type: String, required: true },   // Tên đường
    soNha: { type: String, required: true },   // Số nhà
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('address', AddressSchema);