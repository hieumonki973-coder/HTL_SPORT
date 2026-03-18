const mongoose = require("mongoose");
const { sanpham: Sanpham, bienthe: Bienthe, thuonghieu: ThuongHieu } = require("../../model/model");

const productCon = {

  /* ================== GET ALL ================== */
  getAllproduct: async (req, res) => {
    try {
      const { keyword, category } = req.query;

      const matchStage = {
        deleted_at: null
      };

      if (keyword) {
        matchStage.ten = { $regex: keyword, $options: "i" };
      }

      const pipeline = [
        { $match: matchStage },

        // JOIN dm_sp (bảng trung gian)
        {
          $lookup: {
            from: "dm_sps",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "dm_sp"
          }
        },

        // JOIN category
        {
          $lookup: {
            from: "categories",
            localField: "dm_sp.id_danhmuc",
            foreignField: "_id",
            as: "categories"
          }
        },

        // FILTER theo category nếu có
        ...(category && mongoose.Types.ObjectId.isValid(category)
          ? [{
            $match: {
              "categories._id": new mongoose.Types.ObjectId(category)
            }
          }]
          : []),

        // JOIN biến thể
        {
          $lookup: {
            from: "bienthes",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "bienthe"
          }
        },
        // JOIN loại biến thể
        {
          $lookup: {
            from: "loaibienthes",
            localField: "bienthe.id_loaibienthe",
            foreignField: "_id",
            as: "loaibienthe"
          }
        },
        {
          $lookup: {
            from: "sizes",
            localField: "bienthe.id_size",
            foreignField: "_id",
            as: "sizes"
          }
        },

        // JOIN hình ảnh
        {
          $lookup: {
            from: "hinhs",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "hinh"
          }
        },


        // GỘP màu vào biến thể
        {
          $addFields: {
            bienthe: {
              $map: {
                input: "$bienthe",
                as: "bt",
                in: {
                  _id: "$$bt._id",
                  giagoc: "$$bt.giagoc",
                  giaban: "$$bt.giaban",
                  soluong: "$$bt.soluong",

                  /* ===== COLOR ===== */
                  color: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$loaibienthe",
                              as: "lbt",
                              cond: { $eq: ["$$lbt._id", "$$bt.id_loaibienthe"] }
                            }
                          },
                          as: "lbt",
                          in: "$$lbt.mau"
                        }
                      },
                      0
                    ]
                  },
                  ten_mau: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$loaibienthe",
                              as: "lbt",
                              cond: { $eq: ["$$lbt._id", "$$bt.id_loaibienthe"] }
                            }
                          },
                          as: "lbt",
                          in: "$$lbt.ten"
                        }
                      },
                      0
                    ]
                  },

                  /* ===== SIZE ===== */
                  size: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$sizes",
                              as: "s",
                              cond: { $eq: ["$$s._id", "$$bt.id_size"] }
                            }
                          },
                          as: "s",
                          in: "$$s.ten"
                        }
                      },
                      0
                    ]
                  },

                  /* ===== IMAGE ===== */
                  hinh: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$hinh",
                          as: "img",
                          cond: {
                            $eq: ["$$img.id_bienthe", "$$bt._id"]
                          }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },


        {
          $project: {
            loaibienthe: 0
          }
        },

        { $sort: { createdAt: -1 } }
      ];

      const products = await Sanpham.aggregate(pipeline);

      res.json({
        products,
        total: products.length
      });

    } catch (err) {
      console.error("❌ getAllproduct:", err);
      console.log("BT:", "$$bt._id");
      console.log("IMG:", "$$img.id_bienthe");

      res.status(500).json({ message: err.message });
    }
  },
  /* ================== GET SALE PRODUCTS ================== */
  getSaleProducts: async (req, res) => {
    try {
      const pipeline = [
        {
          $match: { deleted_at: null }
        },
        {
          $lookup: {
            from: "bienthes",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "bienthe"
          }
        },
        { $unwind: "$bienthe" },

        // ✅ FIX CHỖ NÀY
        {
          $match: {
            $expr: {
              $gt: ["$bienthe.giaban", "$bienthe.giagoc"]
            }
          }
        },

        {
          $group: {
            _id: "$_id",
            ten: { $first: "$ten" },
            bienthe: { $push: "$bienthe" }
          }
        },

        // 6️⃣ join hình ảnh
        {
          $lookup: {
            from: "hinhs",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "hinh"
          }
        },

        { $sort: { createdAt: -1 } }
      ];

      const products = await Sanpham.aggregate(pipeline);
      res.json(products);
    } catch (err) {
      console.error("❌ getSaleProducts:", err);
      res.status(500).json({ message: err.message });
    }
  },
  /* ================== GET ONE ================== */
  getAnproduct: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const pipeline = [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            deleted_at: null
          }
        },

        /* ===== dm_sp ===== */
        {
          $lookup: {
            from: "dm_sps",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "dm_sp"
          }
        },

        /* ===== category ===== */
        {
          $lookup: {
            from: "categories",
            localField: "dm_sp.id_danhmuc",
            foreignField: "_id",
            as: "categories"
          }
        },

        /* ===== variant ===== */
        {
          $lookup: {
            from: "bienthes",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "bienthe"
          }
        },

        /* ===== size ===== */
        {
          $lookup: {
            from: "sizes",
            localField: "bienthe.id_size",
            foreignField: "_id",
            as: "sizes"
          }
        },

        /* ===== loại biến thể (màu) ===== */
        {
          $lookup: {
            from: "loaibienthes",
            localField: "bienthe.id_loaibienthe",
            foreignField: "_id",
            as: "loai_bt"
          }
        },

        /* ===== HÌNH ẢNH THEO ID_SẢN_PHẨM (QUAN TRỌNG) ===== */
        {
          $lookup: {
            from: "hinhs",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "hinh"
          }
        },

        /* ===== MAP BIẾN THỂ (KHÔNG DÍNH ẢNH) ===== */
        {
          $addFields: {
            bienthe: {
              $map: {
                input: "$bienthe",
                as: "bt",
                in: {
                  _id: "$$bt._id",
                  giagoc: "$$bt.giagoc",
                  giaban: "$$bt.giaban",
                  soluong: "$$bt.soluong",

                  color: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$loai_bt",
                              as: "lbt",
                              cond: { $eq: ["$$lbt._id", "$$bt.id_loaibienthe"] }
                            }
                          },
                          as: "lbt",
                          in: "$$lbt.mau"
                        }
                      },
                      0
                    ]
                  },

                  ten_mau: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$loai_bt",
                              as: "lbt",
                              cond: { $eq: ["$$lbt._id", "$$bt.id_loaibienthe"] }
                            }
                          },
                          as: "lbt",
                          in: "$$lbt.ten"
                        }
                      },
                      0
                    ]
                  },

                  size: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$sizes",
                              as: "s",
                              cond: { $eq: ["$$s._id", "$$bt.id_size"] }
                            }
                          },
                          as: "s",
                          in: "$$s.ten"
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },

        {
          $project: {
            loai_bt: 0,
            sizes: 0
          }
        }
      ];



      const products = await Sanpham.aggregate(pipeline);

      if (!products.length) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json(products[0]);

    } catch (err) {
      console.error("❌ getAnproduct:", err);
      res.status(500).json({ message: err.message });
    }
  },
  /* ================== GET RELATED PRODUCTS ================== */
  getRelatedByten_loai: async (req, res) => {
    try {
      const { ten_loai } = req.params;

      const pipeline = [
        {
          $match: {
            ten_loai: ten_loai,
            deleted_at: null
          }
        },

        /* ===== variant ===== */
        {
          $lookup: {
            from: "bienthes",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "bienthe"
          }
        },

        /* ===== hình ảnh ===== */
        {
          $lookup: {
            from: "hinhs",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "hinh"
          }
        },

        /* ===== lấy giá nhỏ nhất ===== */
        {
          $addFields: {
            mingiagoc: { $min: "$bienthe.giagoc" }
          }
        },

        {
          $project: {
            ten: 1,
            ten_loai: 1,
            mingiagoc: 1,
            hinh: { $slice: ["$hinh", 1] }
          }
        },

        { $sort: { createdAt: -1 } }
      ];

      const products = await Sanpham.aggregate(pipeline);

      console.log("RELATED BY ten_loai:", ten_loai, "=>", products.length);

      res.json(products);
    } catch (err) {
      console.error("❌ getRelatedBy ten_loai:", err);
      res.status(500).json({ message: err.message });
    }
  },
  getFeaturedProduct: async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 8;

      console.log("🔥 GET FEATURED PRODUCT");

      const products = await Sanpham.aggregate([
        {
          $match: { deleted_at: null }
        },

        // 👉 JOIN BIẾN THỂ
        {
          $lookup: {
            from: "bienthes",
            localField: "_id",
            foreignField: "id_sanpham",
            as: "variants"
          }
        },

        {
          $match: {
            "variants.0": { $exists: true }
          }
        },

        // 👉 JOIN HÌNH ẢNH (🔥 THIẾU CÁI NÀY)
        {
          $lookup: {
            from: "hinhs",              // ⚠️ đúng tên collection hình
            localField: "_id",
            foreignField: "id_sanpham",
            as: "hinh"
          }
        },

        {
          $addFields: {
            totalSold: { $sum: "$variants.luotban" }
          }
        },

        {
          $addFields: {
            score: { $add: ["$luotxem", "$totalSold"] }
          }
        },

        { $sort: { score: -1 } },
        { $limit: limit }
      ]);

      console.log("👉 FEATURED COUNT:", products.length);
      console.log("👉 FEATURED FIRST:", JSON.stringify(products[0], null, 2));

      res.json({
        success: true,
        total: products.length,
        data: products
      });

    } catch (error) {
      console.error("❌ FEATURED ERROR:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },
  /* ================== GET BY BRAND ================== */
  getByBrand :async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ message: "Thiếu brand" });
    }

    // 1️⃣ Tìm thương hiệu theo slug
    const thuonghieu = await ThuongHieu.findOne({
      slug: slug,
      trangthai: "active"
    });

    if (!thuonghieu) {
      return res.status(404).json({ message: "Không tìm thấy thương hiệu" });
    }
    // 2️⃣ Aggregate sản phẩm theo brand
    const pipeline = [
      {
        $match: {
          id_thuonghieu: thuonghieu._id,
          deleted_at: null,
          trangthai: "instock"
        }
      },
      {
        $lookup: {
          from: "bienthes",
          localField: "_id",
          foreignField: "id_sanpham",
          as: "bienthe"
        }
      },
      {
        $lookup: {
          from: "hinhs",
          localField: "_id",
          foreignField: "id_sanpham",
          as: "hinh"
        }
      },
      {
        $addFields: {
          minPrice: { $min: "$bienthe.giaban" }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const products = await Sanpham.aggregate(pipeline);

    return res.status(200).json({
      brand: {
        _id: thuonghieu._id,
        ten: thuonghieu.ten,
        slug: thuonghieu.slug,
        logo: thuonghieu.logo
      },
      total: products.length,
      products
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}
};

module.exports = productCon;
