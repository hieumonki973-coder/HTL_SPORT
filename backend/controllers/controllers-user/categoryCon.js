const { category, author } = require("../../model/model");

const categoryCon = {
  // ➕ Thêm danh mục
  addcategory: async (req, res) => {
    try {
      const data = req.body;
      if (!data._id || data._id === "") delete data._id;

      const newcategory = new category(data);
      const savecategory = await newcategory.save();

      if (data.author) {
        const authorData = await author.findById(data.author);
        if (authorData) {
          authorData.category.push(savecategory._id);
          await authorData.save();
        }
      }

      res.status(200).json(savecategory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 📦 Lấy tất cả
  getAllcategory: async (req, res) => {
    try {
      const categories = await category.find();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 🔍 Lấy 1 category
  getAncategory: async (req, res) => {
    try {
      const cat = await category.findById(req.params.id);
      res.status(200).json(cat);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ✏️ Update
  updatecategory: async (req, res) => {
    try {
      await category.findByIdAndUpdate(req.params.id, req.body);
      res.status(200).json("Cập nhật thành công");
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 🗑 Delete
  deletecategory: async (req, res) => {
    try {
      await category.findByIdAndDelete(req.params.id);
      res.status(200).json("Xoá thành công");
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 👤 USER – category active
  getActiveCategories: async (req, res) => {
    try {
      const categories = await category.find({ status: "active" });
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = categoryCon;
