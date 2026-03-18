const express = require("express");
const router = express.Router();
const adminProductCon = require("../../controllers/controllers-admin/productCon");

// GET ALL
router.get("/", adminProductCon.getAllProducts);

// STATS
router.get("/stats", adminProductCon.getStats);

// GET ONE
router.get("/:id", adminProductCon.getOneProduct);

// CREATE
router.post("/", adminProductCon.createProduct);

// UPDATE
router.put("/:id", adminProductCon.updateProduct);

// DELETE
router.delete("/:id", adminProductCon.deleteProduct);

module.exports = router;
