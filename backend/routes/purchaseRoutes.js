
const express = require('express');

const router = express.Router();

const {
    addPurchase
} = require('../controllers/purchaseController');

// Record a purchase
router.post('/', addPurchase);

module.exports = router;
