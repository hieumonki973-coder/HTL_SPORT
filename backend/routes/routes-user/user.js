const express = require("express");
const router = express.Router();

const middlewareCon = require("../../controllers/controllers-user/middlewareCon");
const userCon = require("../../controllers/controllers-user/userCon");
const uploadAvatar = require("../../middlewares/upload");

// ==================== Profile ====================
// Cập nhật thông tin cá nhân (có thể kèm avatar)
router.put(
  "/me",
  middlewareCon.varifyToken,
  uploadAvatar.single("avatar"),
  userCon.updateMe
);

// Lấy thông tin user đang đăng nhập
router.get("/me", middlewareCon.varifyToken, userCon.getMe);

// Đổi mật khẩu user đang đăng nhập
router.put("/me/password", middlewareCon.varifyToken, userCon.changePassword);

// ==================== Quản lý User ====================
router.get("/stats", middlewareCon.varifyTokenAndAdminAuth, userCon.getUserStats);

router.get("/", middlewareCon.varifyToken, userCon.getUser);
router.get("/:id", middlewareCon.varifyToken, userCon.getAnUser);
router.put("/:id", middlewareCon.varifyToken, userCon.updateUser);
router.delete("/:id", middlewareCon.varifyTokenAndAdminAuth, userCon.deleteUser);

// ==================== Các chức năng nâng cao ====================
router.post("/toggle-lock/:id", middlewareCon.varifyTokenAndAdminAuth, userCon.toggleLockUser);
router.post("/toggle-product-lock/:id", middlewareCon.varifyTokenAndAdminAuth, userCon.toggleProductLock);
router.post("/report-violation/:id", middlewareCon.varifyToken, userCon.reportViolation);
router.post("/bulk", middlewareCon.varifyTokenAndAdminAuth, userCon.deleteUsers);

// ==================== DEV only ====================
if (process.env.NODE_ENV === "development") {
  router.get("/test/get", userCon.getUser);
  router.get("/test/get/:id", userCon.getAnUser);
  router.put("/test/put/:id", userCon.updateUser);
  router.delete("/test/delete/:id", userCon.deleteUser);
}

module.exports = router;
