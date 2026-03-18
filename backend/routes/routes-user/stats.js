const express = require('express');
const router = express.Router();
const statsController = require('../../controllers/controllers-user/stats');

router.get('/', statsController.getStats);

module.exports = router;
