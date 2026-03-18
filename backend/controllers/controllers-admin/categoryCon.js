const { category } = require("../../model/model");

/* ================= GET ALL ================= */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await category.find().sort({ createdAt: -1 });

    const result = categories.map(c => ({
      _id: c._id,
      name: c.ten,
      code: c.slug || "",
      status: c.trangthai || "active"
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh mục", error });
  }
};

/* ================= CREATE ================= */
exports.createCategory = async (req, res) => {
  try {
    const { name, code, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Thiếu name hoặc code" });
    }

    const newCategory = await category.create({
      ten: name,
      slug: code,
      trangthai: status || "active"
    });

    res.status(201).json({
      _id: newCategory._id,
      name: newCategory.ten,
      code: newCategory.slug,
      status: newCategory.trangthai
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo danh mục", error });
  }
};

/* ================= UPDATE ================= */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, status } = req.body;

    const updated = await category.findByIdAndUpdate(
      id,
      {
        ten: name,
        slug: code,
        trangthai: status
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json({
      _id: updated._id,
      name: updated.ten,
      code: updated.slug,
      status: updated.trangthai
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật danh mục", error });
  }
};

/* ================= DELETE ================= */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await category.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa danh mục", error });
  }
};
