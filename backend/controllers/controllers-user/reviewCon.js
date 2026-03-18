const mongoose = require('mongoose');
const Review = require('../../model/review.model');

module.exports = {

  // GET reviews theo sản phẩm
  getByProduct: async (req, res) => {
    try {
      const { productId } = req.params;

      const reviews = await Review.find({ id_sanpham: productId })
        .populate('id_user', 'fullName avatar')
        .sort({ createdAt: -1 });

      const summary = await Review.aggregate([
        {
          $match: {
            id_sanpham: new mongoose.Types.ObjectId(productId)
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            total: { $sum: 1 }
          }
        }
      ]);

      res.json({
        reviews,
        avgRating: summary[0]?.avgRating || 0,
        total: summary[0]?.total || 0
      });

    } catch (err) {
      console.error('❌ getByProduct:', err);
      res.status(500).json({ message: err.message });
    }
  },

  // ADD / UPDATE review
  addReview: async (req, res) => {
    try {
      const { productId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      const review = await Review.findOneAndUpdate(
        { id_sanpham: productId, id_user: userId },
        { rating, comment },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      res.json(review);

    } catch (err) {
      console.error('❌ addReview:', err);
      res.status(500).json({ message: err.message });
    }
  }
};
