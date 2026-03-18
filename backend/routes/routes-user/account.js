const router = require("express").Router();
const accountCon = require("../../controllers/controllers-user/accountCon");
const middlewareCon = require("../../controllers/controllers-user/middlewareCon");
const upload = require("../../middlewares/upload"); 
const Account = require("../../model/model"); // ⛔️ CŨNG CHƯA IMPORT MODEL

// 🟢 Middleware xác thực token
const { varifyToken } = middlewareCon;

// ---------------- ROUTES -------------------

// Đăng ký
router.post("/add", accountCon.addAccount);

// Đăng nhập
router.post("/login", accountCon.login);

// Đăng xuất
router.post("/logout", varifyToken, accountCon.logout);

// Refresh token
router.post("/refresh", accountCon.requestRefreshToken);

// ✅ Upload avatar user
router.put("/avatar", varifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const filePath = `/uploads/users/${req.file.filename}`;

    const updatedUser = await Account.findByIdAndUpdate(
      req.user.id, // Lấy từ token middleware
      { avatar: filePath },
      { new: true }
    );

    res.json({
      message: "Cập nhật ảnh đại diện thành công!",
      avatar: filePath,
      user: updatedUser
    });
  } catch (error) {
    console.error("Lỗi upload avatar:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
});

module.exports = router;
