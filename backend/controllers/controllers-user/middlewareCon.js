const jwt = require("jsonwebtoken");

const middlewareCon = {
  varifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) {
          return res.status(403).json("Token hết hạn hoặc không hợp lệ");
        }

        req.user = user; // lưu user vào request
        next();
      });
    } else {
      res.status(401).json("Chưa được xác thực");
    }
  },

  varifyTokenAndAdminAuth: (req, res, next) => {
    middlewareCon.varifyToken(req, res, () => {
      if (req.user.id === req.params.id || req.user.admin) {
        next();
      } else {
        res.status(403).json("Bạn không có quyền thực hiện thao tác này");
      }
    });
  },

  // ✅ Thêm hàm isAdmin
  isAdmin: (req, res, next) => {
    middlewareCon.varifyToken(req, res, () => {
      if (req.user && req.user.admin) {
        next();
      } else {
        res.status(403).json("Chỉ admin mới được phép thực hiện thao tác này");
      }
    });
  }
};

module.exports = middlewareCon;
