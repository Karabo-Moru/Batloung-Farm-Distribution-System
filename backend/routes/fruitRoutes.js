
const express = require('express');

const router = express.Router();

const {
    getFruits,
    addFruit,
    updateFruit,
    deleteFruit
} = require('../controllers/fruitController');

// Get all fruits
router.get('/', getFruits);

// Add a fruit
router.post('/', addFruit);

// Update a fruit
router.put('/:id', updateFruit);

// Delete a fruit
router.delete('/:id', deleteFruit);

module.exports = router;
