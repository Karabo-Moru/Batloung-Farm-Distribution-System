const express = require('express');

const router = express.Router();

const {
    getSalesFormData,
    addSale
} = require('../controllers/salesController');

// Load vendors and available stock for the Sales form
router.get('/form-data', getSalesFormData);

// Record a sale and update stock
router.post('/', addSale);

module.exports = router;