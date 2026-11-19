
const db = require('../config/db');

// Get all fruits
exports.getFruits = async (req, res) => {
    try {
        const [fruits] = await db.query(
            'SELECT * FROM Fruits ORDER BY fruit_id DESC'
        );

        return res.status(200).json(fruits);

    } catch (error) {
        console.error('Get Fruits Error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve fruits'
        });
    }
};

// Add a fruit
exports.addFruit = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { fruit_name, description, status } = req.body;

        if (
            !fruit_name?.trim() ||
            !description?.trim()
        ) {
            return res.status(400).json({
                message: 'Fruit name and description are required'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [result] = await connection.query(
            `INSERT INTO Fruits (fruit_name, description, status)
             VALUES (?, ?, ?)`,
            [
                fruit_name.trim(),
                description.trim(),
                status || 'Available'
            ]
        );

        const fruitId = result.insertId;

        await connection.query(
            `INSERT INTO Stock
             (fruit_id, packaging_size, available_quantity)
             VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
            [
                fruitId, 'Small', 0,
                fruitId, 'Medium', 0,
                fruitId, 'Large', 0
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message: 'Fruit added successfully',
            fruit_id: fruitId
        });

    } catch (error) {
        console.error('Add Fruit Error:', error.message);

        if (connection && transactionStarted) {
            try {
                await connection.rollback();
                transactionStarted = false;
            } catch (rollbackError) {
                console.error('Fruit rollback failed:', rollbackError.message);
            }
        }

        return res.status(500).json({
            message: 'Failed to add fruit'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Update a fruit
exports.updateFruit = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { fruit_name, description, status } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid fruit ID'
            });
        }

        if (
            !fruit_name?.trim() ||
            !description?.trim() ||
            !status
        ) {
            return res.status(400).json({
                message: 'All fruit fields are required'
            });
        }

        const [result] = await db.query(
            `UPDATE Fruits
             SET fruit_name = ?, description = ?, status = ?
             WHERE fruit_id = ?`,
            [fruit_name.trim(), description.trim(), status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Fruit not found'
            });
        }

        return res.status(200).json({
            message: 'Fruit updated successfully'
        });

    } catch (error) {
        console.error('Update Fruit Error:', error.message);

        return res.status(500).json({
            message: 'Failed to update fruit'
        });
    }
};

// Delete a fruit
exports.deleteFruit = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid fruit ID'
            });
        }

        const [result] = await db.query(
            'DELETE FROM Fruits WHERE fruit_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Fruit not found'
            });
        }

        return res.status(200).json({
            message: 'Fruit deleted successfully'
        });

    } catch (error) {
        console.error('Delete Fruit Error:', error.message);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message: 'This fruit cannot be deleted because stock, purchase or sales records are linked to it'
            });
        }

        return res.status(500).json({
            message: 'Failed to delete fruit'
        });
    }
};
