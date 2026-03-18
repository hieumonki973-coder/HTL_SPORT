const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const addressRoutes = require('./routes/routes-user/Address.routes');

dotenv.config();

/* ===================== APP ===================== */
const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:4200", // Angular
    credentials: true,
  })
);

app.use(morgan("common"));

/* ===================== MONGODB ===================== */
mongoose
  .connect(process.env.MONGOOSE_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* ===================== MULTER ===================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

/* ===================== ROUTES ===================== */
app.use("/v1/author", require("./routes/routes-user/author"));
app.use("/v1/account", require("./routes/routes-user/account"));
app.use("/v1/user", require("./routes/routes-user/user"));
app.use("/v1/category", require("./routes/routes-user/category"));
app.use("/v1/product", require("./routes/routes-user/product"));
app.use("/v1/stats", require("./routes/routes-user/stats"));
app.use("/v1/orders", require("./routes/routes-user/order.routes"));
app.use("/v1/news", require("./routes/routes-user/news.routes"));
app.use("/v1/cart", require("./routes/routes-user/cart"));
app.use("/v1/contact", require("./routes/routes-user/contact"));
app.use("/v1/favorites", require("./routes/routes-user/favorite"));
app.use("/v1/reviews", require("./routes/routes-user/review"));
app.use('/v1/addresses', addressRoutes);



/* ===================== ROUTES-ADMIN ===================== */
app.use("/v1/admin", require("./routes/routes-admin/dasboard"));
app.use("/v1/admin/product", require("./routes/routes-admin/product"));
app.use("/v1/admin/categories", require("./routes/routes-admin/category"));

// app.use("/v1/admin/favorites", require("./routes/routes-admin/favorite"));



/* ===================== STATIC FILE ===================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===================== UPLOAD IMAGE ===================== */
app.post("/uploads", upload.single("image"), (req, res) => {
  if (!req.file) {
return res.status(400).json({ message: "Vui lòng chọn ảnh" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

/* ===================== VIEW IMAGE ===================== */
app.get("/view-image/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  res.sendFile(filePath);
});

/* ===================== HEALTH CHECK ===================== */
app.get("/ping", (req, res) => {
  res.status(200).send("OK");
});

/* ===================== MOMO PAYMENT ===================== */
app.post("/v1/orders/momo-pay", async (req, res) => {
  try {
    const { amount, orderInfo } = req.body;

    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const requestId = partnerCode + Date.now();
    const orderId = requestId;

    const redirectUrl = "http://localhost:4200/payment-success";
    const ipnUrl = "http://localhost:8000/v1/orders/momo-ipn";
    const requestType = "captureWallet";
    const extraData = "";

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v2/gateway/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(requestBody)),
      },
    };

    const momoReq = https.request(options, (momoRes) => {
      let data = "";
      momoRes.on("data", (chunk) => (data += chunk));
      momoRes.on("end", () => res.json(JSON.parse(data)));
    });

    momoReq.on("error", () => {
      res.status(500).json({ message: "Không thể tạo thanh toán MoMo" });
    });

    momoReq.write(JSON.stringify(requestBody));
    momoReq.end();
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ===================== MOMO IPN ===================== */
app.post("/v1/orders/momo-ipn", (req, res) => {
  console.log("MoMo IPN:", req.body);
  res.status(204).send();
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});