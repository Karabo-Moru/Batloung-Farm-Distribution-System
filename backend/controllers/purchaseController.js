
const db = require('../config/db');

// Record a purchase and increase stock
exports.addPurchase = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        const { supplier_id, items } = req.body;

        // Validate purchase information
        if (
            !Number.isInteger(Number(supplier_id)) ||
            Number(supplier_id) <= 0 ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: 'A valid supplier ID and at least one purchase item are required'
            });
        }

        // Validate each purchase item
        for (const item of items) {
            const fruitId = Number(item.fruit_id);
            const quantity = Number(item.quantity);
            const unitCost = Number(item.unit_cost);

            if (
                !Number.isInteger(fruitId) ||
                fruitId <= 0 ||
                !['Small', 'Medium', 'Large'].includes(item.packaging_size) ||
                !Number.isInteger(quantity) ||
                quantity <= 0 ||
                !Number.isFinite(unitCost) ||
                unitCost < 0
            ) {
                return res.status(400).json({
                    message: 'Each item must have a valid fruit, packaging size, positive quantity and valid unit cost'
                });
            }
        }

        await connection.beginTransaction();
        transactionStarted = true;

        // Check supplier
        const [suppliers] = await connection.query(
            'SELECT supplier_id FROM Suppliers WHERE supplier_id = ?',
            [supplier_id]
        );

        if (suppliers.length === 0) {
            const error = new Error('Supplier not found');
            error.statusCode = 404;
            throw error;
        }

        let totalAmount = 0;

        // Calculate purchase total
        for (const item of items) {
            totalAmount += Number(
                (Number(item.quantity) * Number(item.unit_cost)).toFixed(2)
            );
        }

        totalAmount = Number(totalAmount.toFixed(2));

        // Create purchase record
        const [purchaseResult] = await connection.query(
            `INSERT INTO Purchases
             (supplier_id, purchase_date, total_amount)
             VALUES (?, CURDATE(), ?)`,
            [supplier_id, totalAmount]
        );

        const purchaseId = purchaseResult.insertId;

        // Record items and update stock
        for (const item of items) {
            const [fruits] = await connection.query(
                'SELECT fruit_id FROM Fruits WHERE fruit_id = ?',
                [item.fruit_id]
            );

            if (fruits.length === 0) {
                const error = new Error(`Fruit ID ${item.fruit_id} does not exist`);
                error.statusCode = 404;
                throw error;
            }

            await connection.query(
                `INSERT INTO PurchaseDetails
                 (purchase_id, fruit_id, quantity, unit_cost, packaging_size)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    purchaseId,
                    item.fruit_id,
                    item.quantity,
                    item.unit_cost,
                    item.packaging_size
                ]
            );

            await connection.query(
                `INSERT INTO Stock
                 (fruit_id, packaging_size, available_quantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 available_quantity = available_quantity + ?`,
                [
                    item.fruit_id,
                    item.packaging_size,
                    item.quantity,
                    item.quantity
                ]
            );
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message: 'Purchase recorded and stock updated successfully',
            purchase_id: purchaseId,
            total_amount: totalAmount
        });

    } catch (error) {
        console.error('Purchase Error:', error.message);

        if (connection && transactionStarted) {
            try {
                await connection.rollback();
                transactionStarted = false;
            } catch (rollbackError) {
                console.error('Purchase rollback failed:', rollbackError.message);
            }
        }

        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500
                ? 'Purchase failed. Please try again later.'
                : error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
