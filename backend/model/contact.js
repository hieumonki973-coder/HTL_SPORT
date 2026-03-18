const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema); // ✅ Tạo model

module.exports = { contact: Contact }; // ✅ Export đúng chuẩn
