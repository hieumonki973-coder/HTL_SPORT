const {
  sanpham,
  bienthe,
  dm_sp,
  category
} = require("../../model/model");

const getDashboardStats = async (req, res) => {
  try {
    /* ====== DOANH THU ====== */
    const [revenueData] = await bienthe.aggregate([
      { $match: { deleted_at: null, trangthai: "active" } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$giagoc", "$luotban"] }
          },
          totalSold: { $sum: "$luotban" },
          inventory: { $sum: "$soluong" }
        }
      }
    ]);

    /* ====== TOP SẢN PHẨM ====== */
    const topProducts = await bienthe.aggregate([
      { $match: { deleted_at: null } },
      {
        $lookup: {
          from: "sanphams",
          localField: "id_sanpham",
          foreignField: "_id",
          as: "sanpham"
        }
      },
      { $unwind: "$sanpham" },
      {
        $project: {
          ten: "$sanpham.ten",
          luotban: 1,
          giagoc: 1,
          doanhthu: { $multiply: ["$luotban", "$giagoc"] },
          createdAt: 1
        }
      },
      { $sort: { luotban: -1 } },
      { $limit: 5 }
    ]);

    /* ====== DOANH THU THEO DANH MỤC ====== */
    const categoryRevenue = await bienthe.aggregate([
      { $match: { deleted_at: null } },
      {
        $lookup: {
          from: "sanphams",
          localField: "id_sanpham",
          foreignField: "_id",
          as: "sanpham"
        }
      },
      { $unwind: "$sanpham" },
      {
        $lookup: {
          from: "dm_sps",
          localField: "sanpham._id",
          foreignField: "id_sanpham",
          as: "dm"
        }
      },
      { $unwind: { path: "$dm", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "dm.id_danhmuc",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category.ten",
          revenue: {
            $sum: { $multiply: ["$giagoc", "$luotban"] }
          }
        }
      }
    ]);

    res.json({
      totalRevenue: revenueData?.totalRevenue || 0,
      totalInventory: revenueData?.inventory || 0,
      totalOrders: revenueData?.totalSold || 0,
      topProducts,
      categoryRevenue
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
};

module.exports = {
  getDashboardStats
};
