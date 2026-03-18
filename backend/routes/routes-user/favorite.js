const express = require("express");
const router = express.Router();
const { addFavorite, getFavoritesByUser, removeFavorite } = require("../../controllers/controllers-user/favorite");
const { varifyToken } = require("../../controllers/controllers-user/middlewareCon");

// User phải đăng nhập mới dùng được
router.post("/", varifyToken, addFavorite);
router.get("/", varifyToken, getFavoritesByUser);
router.delete('/:id', removeFavorite);


module.exports = router;
