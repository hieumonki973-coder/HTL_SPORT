const { account, theme } = require("../../model/model");
const bcrypt = require("bcryptjs");

const userCon = {
  // 📌 Lấy toàn bộ user
  getUser: async (req, res) => {
    try {
      const users = await account.find().populate("products");
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng", error });
    }
  },

  // 📌 Lấy 1 user theo id
  getAnUser: async (req, res) => {
    try {
      const user = await account.findById(req.params.id).populate("products");
      if (!user) return res.status(404).json("Không tìm thấy người dùng");
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng", error });
    }
  },

  // 📌 Update user (admin)
  updateUser: async (req, res) => {
    try {
      const updated = await account.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json({ message: "Cập nhật thành công", user: updated });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi cập nhật", error });
    }
  },

  // 📌 Xoá 1 user
  deleteUser: async (req, res) => {
    try {
      const user = await account.findById(req.params.id);
      if (!user) return res.status(404).json("Không tìm thấy người dùng");

      await theme.deleteMany({ author: user._id });
      await account.findByIdAndDelete(req.params.id);
      res.status(200).json("Xoá thành công");
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xoá", error });
    }
  },

  // 📌 Xoá nhiều user
  deleteUsers: async (req, res) => {
    try {
      const { userIds } = req.body;
      await Promise.all(
        userIds.map(async (id) => {
          await theme.deleteMany({ author: id });
          await account.findByIdAndDelete(id);
        })
      );
      res.status(200).json("Xoá nhiều người dùng thành công");
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xoá nhiều người dùng", error });
    }
  },

  // 📊 Thống kê user
  getUserStats: async (req, res) => {
    try {
      const users = await account.find();
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u?.status === "active").length,
        lockedUsers: users.filter((u) => u?.status === "locked").length,
        pendingUsers: users.filter((u) => u?.status === "pending").length,
        totalViolations: users.reduce((acc, user) => {
          const spam = user?.spamCount ?? 0;
          const cancel = user?.cancellationCount ?? 0;
          const ghost = user?.ghostingCount ?? 0;
          return acc + spam + cancel + ghost;
        }, 0),
      };
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy thống kê", error });
    }
  },

  // 📌 Khoá / mở khoá user
  toggleLockUser: async (req, res) => {
    try {
      const { lockReason } = req.body;
      const user = await account.findById(req.params.id);
      if (!user) return res.status(404).json("Không tìm thấy người dùng");

      const newStatus = user.status === "locked" ? "active" : "locked";
      user.status = newStatus;
      user.lockReason = newStatus === "locked" ? lockReason : null;
      await user.save();

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi khoá/mở khoá", error });
    }
  },

  // 📌 Khoá / mở khoá product của user
  toggleProductLock: async (req, res) => {
    try {
      const { productId } = req.body;
      const user = await account.findById(req.params.id);
      if (!user) return res.status(404).json("Không tìm thấy người dùng");

      if (!user.products) user.products = [];

      const hasProduct = user.products.includes(productId);
      if (hasProduct) {
        user.products = user.products.filter((p) => p.toString() !== productId);
      } else {
        user.products.push(productId);
      }

      await user.save();
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi khoá/mở khoá sản phẩm", error });
    }
  },

  // 📌 Lấy thông tin cá nhân user đang đăng nhập
  getMe: async (req, res) => {
    try {
      const user = await account.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json("Không tìm thấy người dùng");
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng", error });
    }
  },

  // 📌 Cập nhật thông tin cá nhân user đang đăng nhập
  updateMe: async (req, res) => {
    try {
      const user = await account.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

      const updatableFields = ["fullName", "email", "phone", "address"];

      for (const field of updatableFields) {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      }

      // Xử lý avatar (được middleware uploadAvatar đẩy vào req.file)
      if (req.file) {
        user.avatar = `/uploads/users/${req.file.filename}`;
      }

      await user.save();
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi khi cập nhật", error });
    }
  },

  // 📌 Đổi mật khẩu
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu" });
      }

      const user = await account.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi đổi mật khẩu", error });
    }
  },

  // 📌 Báo cáo vi phạm
  reportViolation: async (req, res) => {
    try {
      const { violationType } = req.body;
      const user = await account.findById(req.params.id);
      if (!user) return res.status(404).json("Không tìm thấy người dùng");

      switch (violationType) {
        case "spam":
          user.spamCount = (user.spamCount || 0) + 1;
          break;
        case "cancellation":
          user.cancellationCount = (user.cancellationCount || 0) + 1;
          break;
        case "ghosting":
          user.ghostingCount = (user.ghostingCount || 0) + 1;
          break;
        default:
          return res.status(400).json("Loại vi phạm không hợp lệ");
      }

      await user.save();
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi báo cáo vi phạm", error });
    }
  },
};

module.exports = userCon;
