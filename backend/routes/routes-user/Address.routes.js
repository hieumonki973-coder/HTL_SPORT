const express = require('express');
const router = express.Router();
const addressController = require('../../controllers/controllers-user/address.controller');
const { varifyToken } = require('../../controllers/controllers-user/middlewareCon');

router.get('/',              varifyToken, addressController.getMyAddresses);
router.post('/',             varifyToken, addressController.addAddress);
router.put('/:id',           varifyToken, addressController.updateAddress);
router.delete('/:id',        varifyToken, addressController.deleteAddress);
router.patch('/:id/default', varifyToken, addressController.setDefaultAddress);

module.exports = router;