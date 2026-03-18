// models/giohang.model.js
const mongoose = require('mongoose');

const gioHangSchema = new mongoose.Schema({
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: true
  },

  id_sanpham: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sanpham',
    required: true
  },

  id_bienthe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bienthe',
    default: null
  },

  soluong: {
    type: Number,
    required: true,
    min: 1
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('giohang', gioHangSchema);
