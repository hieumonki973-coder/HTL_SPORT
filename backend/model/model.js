const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

/* ================= BRAND ================= */
const thuonghieuSchema = new mongoose.Schema(
  {
    ten: { type: String, required: true },
    slug: String,
    logo: String,
    trangthai: { type: String, default: "active" }
  },
  { timestamps: true }
);

/* ================= VARIANT TYPE ================= */
/* ================= VARIANT TYPE ================= */
const loaibientheSchema = new mongoose.Schema(
  {
    ten: { type: String, required: true },      // Đỏ, Xanh, S, M, L
    type: {
      type: String,
      enum: ["color", "size"],
      required: true
    },
    color_code: { type: String },               // chỉ dùng khi type = color
    trangthai: { type: String, default: "active" }
  },
  { timestamps: true }
);


/* ================= PRODUCT ================= */
const sanphamSchema = new mongoose.Schema(
  {
    ten: { type: String, required: true },
    slug: String,
    mota: String,
    xuatxu: String,
    sanxuat: String,
    trangthai: { type: String, default: "active" },
    giagiam: Number,
    luotxem: { type: Number, default: 0 },
    id_thuonghieu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "thuonghieu"
    },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: true }
);

sanphamSchema.plugin(mongoosePaginate);

/* ================= VARIANT ================= */
const bientheSchema = new mongoose.Schema(
  {
    id_sanpham: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sanpham",
      required: true
    },
    id_loaibienthe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "loaibienthe"
    },
    id_size: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "size",
      required: true
    },
    giagoc: Number,
    giaban: Number,

    soluong: Number,
    trangthai: { type: String, default: "active" },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: true }
);

/* ================= IMAGE ================= */
const hinhSchema = new mongoose.Schema(
  {
    id_sanpham: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sanpham",
      required: true
    },

    // ⭐ QUAN TRỌNG
    id_bienthe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bienthe",
      required: true
    },

    url: { type: String, required: true },
    trangthai: { type: String, default: "active" }
  },
  { timestamps: true }
);

/* ================= CATEGORY ================= */
const categorySchema = new mongoose.Schema(
  {
    ten: {
      type: String,
      required: true,
      minlength: 3,
      unique: true
    },
    slug: String,
    hinh: { type: String, default: "" },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null
    },
    trangthai: { type: String, default: "active" }
  },
  { timestamps: true }
);

categorySchema.plugin(mongoosePaginate);

/* ================= PRODUCT - CATEGORY ================= */
const dmspSchema = new mongoose.Schema(
  {
    id_sanpham: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sanpham",
      required: true
    },
    id_danhmuc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true
    }
  },
  { timestamps: true }
);

/* ================= ACCOUNT ================= */
const accountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 6, unique: true },
    fullName: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, match: /^[0-9]{9,12}$/ },
    address: String,
    avatar: String,
    admin: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "locked", "pending"],
      default: "pending"
    }
  },
  { timestamps: true }
);

accountSchema.plugin(mongoosePaginate);

/* ================= NEWS ================= */
const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    image: String
  },
  { timestamps: true }
);

newsSchema.plugin(mongoosePaginate);

/* ================= STATS ================= */
const statsSchema = new mongoose.Schema(
  {
    totalRevenue: { type: String, default: "0 VNĐ" },
    inventory: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    change: { type: String, default: "0%" },
    status: { type: String, default: "success" }
  },
  { timestamps: true }
);

statsSchema.plugin(mongoosePaginate);
/* ================= SIZE ================= */
const sizeSchema = new mongoose.Schema(
  {
    ten: {
      type: String,
      required: true,
      unique: true // S, M, L, XL, Free Size
    },

    code: {
      type: String,
      unique: true // S, M, L, XL, FS (dùng cho FE)
    },

    thu_tu: {
      type: Number,
      default: 0 // dùng để sort: S < M < L < XL
    },

    trangthai: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);


/* ================= EXPORT ================= */
module.exports = {
  sanpham: mongoose.model("sanpham", sanphamSchema),
  bienthe: mongoose.model("bienthe", bientheSchema),
  loaibienthe: mongoose.model("loaibienthe", loaibientheSchema),
  hinh: mongoose.model("hinh", hinhSchema),
  category: mongoose.model("category", categorySchema),
  dm_sp: mongoose.model("dm_sp", dmspSchema),
  thuonghieu: mongoose.model("thuonghieu", thuonghieuSchema),
  account: mongoose.model("account", accountSchema),
  news: mongoose.model("news", newsSchema),
  stats: mongoose.model("stats", statsSchema),
  size: mongoose.model("size", sizeSchema)
};
