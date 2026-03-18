const mongoose = require("mongoose");
const { sanpham: Sanpham } = require("../../model/model");

const adminProductCon = {

  /* ================== GET ALL (ADMIN) ================== */
  getAllProducts: async (req, res) => {
    try {
      const { keyword, category, includeDeleted } = req.query;

      const matchStage = {};

      // admin có thể xem cả deleted
      if (!includeDeleted) {
        matchStage.deleted_at = null;
      }

      if (keyword) {
        matchStage.ten = { $regex: keyword, $options: "i" };
      }

      const pipeline = [
        { $match: matchStage },

        // JOIN dm_sp
        {
          $lookup: {
            from: "dm_sps",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "dm_sp"
          }
        },

        // JOIN category
        {
          $lookup: {
            from: "categories",
            localField: "dm_sp.id_danhmuc",
            foreignField: "_id",
            as: "categories"
          }
        },

        // FILTER theo category
        ...(category && mongoose.Types.ObjectId.isValid(category)
          ? [{
              $match: {
                "categories._id": new mongoose.Types.ObjectId(category)
              }
            }]
          : []),

        // JOIN biến thể
        {
          $lookup: {
            from: "bienthes",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "bienthe"
          }
        },

        // JOIN loại biến thể
        {
          $lookup: {
            from: "loaibienthes",
            localField: "bienthe.id_loaibienthe",
            foreignField: "_id",
            as: "loaibienthe"
          }
        },

        // JOIN hình ảnh
        {
          $lookup: {
            from: "hinhs",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "hinh"
          }
        },

        { $sort: { createdAt: -1 } }
      ];

      const products = await Sanpham.aggregate(pipeline);

      res.json({
        products,
        total: products.length
      });

    } catch (err) {
      console.error("❌ admin.getAllProducts:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ================== GET ONE (ADMIN) ================== */
  getOneProduct: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const pipeline = [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id)
          }
        },

        {
          $lookup: {
            from: "dm_sps",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "dm_sp"
          }
        },

        {
          $lookup: {
            from: "categories",
            localField: "dm_sp.id_danhmuc",
            foreignField: "_id",
            as: "categories"
          }
        },

        {
          $lookup: {
            from: "bienthes",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "bienthe"
          }
        },

        {
          $lookup: {
            from: "loaibienthes",
            localField: "bienthe.id_loaibienthe",
            foreignField: "_id",
            as: "loaibienthe"
          }
        },

        {
          $lookup: {
            from: "hinhs",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "hinh"
          }
        }
      ];

      const products = await Sanpham.aggregate(pipeline);

      if (!products.length) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json(products[0]);

    } catch (err) {
      console.error("❌ admin.getOneProduct:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ================== CREATE ================== */
  createProduct: async (req, res) => {
    try {
      const data = req.body;

      if (!data.ten) {
        return res.status(400).json({ message: "Tên sản phẩm là bắt buộc" });
      }

      const product = new Sanpham({
        ...data,
        deleted_at: null
      });

      await product.save();

      res.status(201).json(product);

    } catch (err) {
      console.error("❌ admin.createProduct:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ================== UPDATE ================== */
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const updated = await Sanpham.findByIdAndUpdate(
        id,
        data,
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json(updated);

    } catch (err) {
      console.error("❌ admin.updateProduct:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ================== SOFT DELETE ================== */
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const deleted = await Sanpham.findByIdAndUpdate(
        id,
        { deleted_at: new Date() },
        { new: true }
      );

      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json({ message: "Đã xoá sản phẩm", product: deleted });

    } catch (err) {
      console.error("❌ admin.deleteProduct:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ================== STATS ================== */
  getStats: async (req, res) => {
    try {
      const total = await Sanpham.countDocuments();
      const active = await Sanpham.countDocuments({ deleted_at: null });
      const deleted = await Sanpham.countDocuments({ deleted_at: { $ne: null } });

      res.json({
        total,
        active,
        deleted
      });

    } catch (err) {
      console.error("❌ admin.getStats:", err);
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = adminProductCon;
