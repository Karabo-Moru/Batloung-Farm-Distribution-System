
const express = require('express');

const router = express.Router();

const {
    addPayment,
    getOutstandingSales,
    getVendorBalances
} = require('../controllers/paymentController');

// View sales with outstanding balances
router.get('/outstanding-sales', getOutstandingSales);

// Record a vendor payment
router.post('/', addPayment);

// View vendor balances
router.get('/vendor-balances', getVendorBalances);

module.exports = router;
