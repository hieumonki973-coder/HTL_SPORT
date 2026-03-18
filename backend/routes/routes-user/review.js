const express = require("express");
const router = express.Router();

const reviewCon = require("../../controllers/controllers-user/reviewCon");
const { varifyToken } = require("../../controllers/controllers-user/middlewareCon");

router.get(
  '/:productId',
  reviewCon.getByProduct
);

router.post(
    
  '/:productId',
  
  varifyToken,          // ✅ function
  reviewCon.addReview
  
);

module.exports = router;
