
const db = require('../config/db');

// Get all stock grouped by fruit and packaging size
exports.getStock = async (req, res) => {
    try {
        const [stock] = await db.query(
            `SELECT
                s.stock_id,
                f.fruit_id,
                f.fruit_name,
                s.packaging_size,
                s.available_quantity
             FROM stock s
             JOIN fruits f ON s.fruit_id = f.fruit_id
             ORDER BY f.fruit_name, s.packaging_size`
        );

        return res.status(200).json(stock);

    } catch (error) {
        console.error('Get Stock Error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve stock'
        });
    }
};

// Get low-stock items (10 or fewer boxes)
exports.getLowStock = async (req, res) => {
    try {
        const [stock] = await db.query(
            `SELECT
                f.fruit_name,
                s.packaging_size,
                s.available_quantity
             FROM stock s
             JOIN fruits f ON s.fruit_id = f.fruit_id
             WHERE s.available_quantity <= 10
             ORDER BY s.available_quantity ASC`
        );

        return res.status(200).json(stock);

    } catch (error) {
        console.error('Get Low Stock Error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve low stock'
        });
    }
};
