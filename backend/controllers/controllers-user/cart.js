// controllers/controllers-user/cart.js
const mongoose = require('mongoose');

const GioHang = require('../../model/cart');
const { bienthe: Bienthe, sanpham: Sanpham } = require('../../model/model');

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  try {
    const id_user = req.user.id;
    const { id_sanpham, id_bienthe, soluong = 1 } = req.body;

    if (!id_sanpham) return res.status(400).json({ success: false, message: 'Thiếu id sản phẩm' });

    const product = await Sanpham.findById(id_sanpham);
    if (!product) return res.status(400).json({ success: false, message: 'Sản phẩm không tồn tại' });

    if (id_bienthe) {
      const variant = await Bienthe.findById(id_bienthe);
      if (!variant) return res.status(400).json({ success: false, message: 'Biến thể không tồn tại' });
      if (variant.soluong < soluong) return res.status(400).json({ success: false, message: `Chỉ còn ${variant.soluong} sản phẩm` });
    }

    const existingItem = await GioHang.findOne({ id_user, id_sanpham, id_bienthe });

    if (existingItem) {
      existingItem.soluong += soluong;
      await existingItem.save();
    } else {
      await new GioHang({ id_user, id_sanpham, id_bienthe, soluong }).save();
    }

    const updatedCart = await exports.getFormattedCart(id_user);
    res.json({ success: true, message: 'Đã thêm vào giỏ hàng', items: updatedCart });
  } catch (err) {
    console.error('❌ addToCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET USER CART ================= */
exports.getUserCart = async (req, res) => {
  try {
    const items = await exports.getFormattedCart(req.user.id);
    res.json({ success: true, total: items.length, items });
  } catch (err) {
    console.error('❌ getUserCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= REMOVE ================= */
exports.removeFromCart = async (req, res) => {
  try {
    const id_user = req.user.id;
    const { id_bienthe } = req.params;
    await GioHang.deleteOne({ id_user, id_bienthe });
    const updatedCart = await exports.getFormattedCart(id_user);
    res.json({ success: true, message: 'Đã xóa sản phẩm', items: updatedCart });
  } catch (err) {
    console.error('❌ removeFromCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DECREASE ================= */
exports.decreaseFromCart = async (req, res) => {
  try {
    const id_user = req.user.id;
    const { id_bienthe } = req.params;
    const item = await GioHang.findOne({ id_user, id_bienthe });
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    if (item.soluong <= 1) await item.deleteOne();
    else { item.soluong -= 1; await item.save(); }

    const updatedCart = await exports.getFormattedCart(id_user);
    res.json({ success: true, message: 'Đã giảm số lượng', items: updatedCart });
  } catch (err) {
    console.error('❌ decreaseFromCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE QUANTITY ================= */
exports.updateQuantity = async (req, res) => {
  try {
    const id_user = req.user.id;
    const { id_bienthe } = req.params;
    const { soluong } = req.body;

    if (!soluong || soluong < 1) return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });

    const item = await GioHang.findOne({ id_user, id_bienthe });
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    item.soluong = soluong;
    await item.save();

    const updatedCart = await exports.getFormattedCart(id_user);
    res.json({ success: true, message: 'Cập nhật thành công', items: updatedCart });
  } catch (err) {
    console.error('❌ updateQuantity:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CLEAR CART ================= */
exports.clearCart = async (req, res) => {
  try {
    await GioHang.deleteMany({ id_user: req.user.id });
    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng', items: [] });
  } catch (err) {
    console.error('❌ clearCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= HELPER - PIPELINE CHUNG (ĐÃ FIX) ================= */
exports.getFormattedCart = async (id_user) => {
  const pipeline = [
    { $match: { id_user: new mongoose.Types.ObjectId(id_user) } },

    // Populate Product
    { $lookup: { from: "sanphams", localField: "id_sanpham", foreignField: "_id", as: "sanpham" } },
    { $unwind: { path: "$sanpham", preserveNullAndEmptyArrays: true } },

    // Populate Variant
    { $lookup: { from: "bienthes", localField: "id_bienthe", foreignField: "_id", as: "bienthe" } },
    { $unwind: { path: "$bienthe", preserveNullAndEmptyArrays: true } },

    // Populate Images
    { $lookup: { from: "hinhs", localField: "sanpham._id", foreignField: "id_sanpham", as: "sanpham.hinh" } },

    // Populate Size
    { $lookup: { from: "sizes", localField: "bienthe.id_size", foreignField: "_id", as: "bienthe.size" } },
    { $unwind: { path: "$bienthe.size", preserveNullAndEmptyArrays: true } },

    // Populate LoaiBienThe (Color)
    { $lookup: { from: "loaibienthes", localField: "bienthe.id_loaibienthe", foreignField: "_id", as: "bienthe.loaibienthe" } },
    { $unwind: { path: "$bienthe.loaibienthe", preserveNullAndEmptyArrays: true } },

    // Project cuối cùng (đây là điểm quan trọng nhất)
    {
      $project: {
        _id: 1,
        id_sanpham: "$id_sanpham",
        id_bienthe: "$id_bienthe",
        soluong: 1,
        created_at: 1,

        sanpham: "$sanpham",   // ← Product đầy đủ (có hinh)
        bienthe: {
          _id: "$bienthe._id",
          id_sanpham: "$bienthe.id_sanpham",
          id_loaibienthe: "$bienthe.loaibienthe",
          id_size: "$bienthe.id_size",
          size: "$bienthe.size.ten",
          color: "$bienthe.loaibienthe.color_code",     // ← đúng tên field trong model
          ten_mau: "$bienthe.loaibienthe.ten",
          giagoc: "$bienthe.giagoc",
          giaban: "$bienthe.giaban",
          soluong: "$bienthe.soluong"
        },
        hinh: "$sanpham.hinh"
      }
    },
    { $sort: { created_at: -1 } }
  ];

  return await GioHang.aggregate(pipeline);
};