const express = require("express");
const router = express.Router();
const categoryCon = require("../../controllers/controllers-user/categoryCon");

/* ================= USER APIs (ĐẶT TRƯỚC) ================= */

// 👤 Lấy category active cho user
router.get("/active", categoryCon.getActiveCategories);

/* ================= ADMIN APIs ================= */

// ➕ Thêm danh mục
router.post("/", categoryCon.addcategory);

// 📦 Lấy tất cả danh mục
router.get("/", categoryCon.getAllcategory);

// 🔍 Lấy 1 danh mục theo ID
router.get("/:id", categoryCon.getAncategory);

// ✏️ Cập nhật danh mục
router.put("/:id", categoryCon.updatecategory);

// 🗑️ Xoá danh mục
router.delete("/:id", categoryCon.deletecategory);

module.exports = router;
