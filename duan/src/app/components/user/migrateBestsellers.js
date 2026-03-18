const mongoose = require("mongoose");
const Bestseller = require("./models/bestseller");
const Product = require("./models/product");

mongoose.connect("mongodb://127.0.0.1:27017/funsport"); // đổi theo DB của bạn

(async () => {
  try {
    const all = await Bestseller.find();
    for (let item of all) {
      // Nếu item có productId thì skip
      if (item.productId) continue;

      // Nếu đang clone full product thì lấy _id đó
      const productId = item._id; // vì trước clone nên _id chính là productId
      const productExists = await Product.findById(productId);

      if (productExists) {
        item.productId = productId;
        await item.save();
        console.log(`✅ Đã migrate bestseller ${item._id}`);
      } else {
        console.log(`⚠️ Không tìm thấy product cho bestseller ${item._id}`);
      }
    }
    console.log("Hoàn tất migrate!");
  } catch (err) {
    console.error("❌ Lỗi migrate:", err);
  } finally {
    mongoose.disconnect();
  }
})();
