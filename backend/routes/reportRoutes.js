
const express = require('express');

const router = express.Router();

const {
    getTopFruits,
    getRevenueReport,
    getTopVendor,
    getStockReport
} = require('../controllers/reportController');

// Five most sold fruits
router.get('/top-fruits', getTopFruits);

// Revenue report
router.get('/revenue', getRevenueReport);

// Vendor with the most boxes
router.get('/top-vendor', getTopVendor);

// Current stock report
router.get('/stock', getStockReport);

module.exports = router;
