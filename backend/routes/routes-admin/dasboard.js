const express = require("express");
const router = express.Router();

const {
  getDashboardStats
} = require("../../controllers/controllers-admin/dashboard");

router.get("/dashboard", getDashboardStats);

module.exports = router;
