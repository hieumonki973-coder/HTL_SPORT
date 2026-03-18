const express = require("express");
const router = express.Router();
const productCon = require("../../controllers/controllers-user/productCon");

/* ================= PRODUCT ROUTES ================= */

// 🔎 Lấy danh sách sản phẩm
router.get("/", productCon.getAllproduct);
router.get("/sale", productCon.getSaleProducts);
router.get("/featured", productCon.getFeaturedProduct);
router.get("/brand/:slug", productCon.getByBrand);

// 🔍 Các route có param cụ thể
router.get("/related/:ten_loai", productCon.getRelatedByten_loai);

// ❗ LUÔN ĐỂ CUỐI
router.get("/:id", productCon.getAnproduct);

module.exports = router;
