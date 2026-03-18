const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Fix OverwriteModelError
const NewsModel = mongoose.models.news || mongoose.model("news", newsSchema);

module.exports = { news: NewsModel }; // export object có key news
