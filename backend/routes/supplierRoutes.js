
const express = require('express');
const router = express.Router();

const {
    getSuppliers,
    getSupplierById,
    addSupplier,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');

// Get all suppliers
router.get('/', getSuppliers);

// Get one supplier by ID
router.get('/:id', getSupplierById);

// Add a supplier
router.post('/', addSupplier);

// Update a supplier
router.put('/:id', updateSupplier);

// Delete a supplier
router.delete('/:id', deleteSupplier);

module.exports = router;
