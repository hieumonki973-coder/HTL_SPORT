const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  id_sanpham: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sanpham',
    required: true
  },
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 1 user chỉ được review 1 lần / sản phẩm
reviewSchema.index(
  { id_sanpham: 1, id_user: 1 },
  { unique: true }
);

module.exports = mongoose.model('reviews', reviewSchema);
