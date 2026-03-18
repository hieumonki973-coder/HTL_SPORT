const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📂 Đường dẫn thư mục upload
const uploadDir = path.join(__dirname, "../uploads/users");

// 🔧 Đảm bảo thư mục tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚡ Cấu hình storage
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const uniqueName = `${Date.now()}-${baseName}${ext}`;
    cb(null, uniqueName);
  },
});

// 🎯 Bộ lọc file
const fileFilter = (_, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  allowedTypes.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("❌ Chỉ chấp nhận file ảnh (jpeg, png, jpg, webp)"), false);
};

// 🚀 Cấu hình multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // ⏳ giới hạn 2MB
});

module.exports = upload;
