
const express = require('express');

const router = express.Router();

const {
    getVendors,
    addVendor,
    searchVendors,
    updateVendor
} = require('../controllers/vendorController');

// Search vendors
router.get('/search', searchVendors);

// Get all vendors
router.get('/', getVendors);

// Register a vendor
router.post('/', addVendor);

// Update vendor details
router.put('/:id', updateVendor);

module.exports = router;
