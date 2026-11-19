
const express = require('express');

const router = express.Router();

const {
    getStock,
    getLowStock
} = require('../controllers/stockController');

// Get all stock
router.get('/', getStock);

// Get low-stock items
router.get('/low-stock', getLowStock);

module.exports = router;
