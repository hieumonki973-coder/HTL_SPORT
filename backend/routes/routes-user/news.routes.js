const express = require("express");
const router = express.Router();
const { news } = require("../../model/new");

// GET tất cả bài viết tin tức
router.get("/", async (req, res) => {
  try {
    const allNews = await news.find().sort({ createdAt: -1 });
    res.json(allNews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET bài viết theo ID
router.get("/:id", async (req, res) => {
  try {
    const foundNews = await news.findById(req.params.id);
    if (!foundNews) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(foundNews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST tạo tin mới
router.post("/", async (req, res) => {
  try {
    const newPost = new news(req.body);
    const saved = await newPost.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
