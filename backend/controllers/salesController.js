
const db = require('../config/db');

// Load information needed by the Sales form
exports.getSalesFormData = async (req, res) => {
    try {
        const [vendors] = await db.query(
            `SELECT vendor_id, vendor_name
             FROM Vendors
             ORDER BY vendor_name`
        );

        const [stock] = await db.query(
            `SELECT
                f.fruit_id,
                f.fruit_name,
                s.packaging_size,
                s.available_quantity,
                (
                    SELECT pd.unit_cost
                    FROM PurchaseDetails pd
                    WHERE pd.fruit_id = s.fruit_id
                    AND pd.packaging_size = s.packaging_size
                    ORDER BY pd.purchase_detail_id DESC
                    LIMIT 1
                ) AS latest_cost
             FROM Stock s
             JOIN Fruits f ON f.fruit_id = s.fruit_id
             ORDER BY f.fruit_name, s.packaging_size`
        );

        const saleItems = stock.map(item => ({
            ...item,
            unit_price: item.latest_cost === null
                ? null
                : Number((Number(item.latest_cost) * 1.5).toFixed(2))
        }));

        res.status(200).json({
            vendors,
            stock: saleItems
        });

    } catch (error) {
        console.error('Sales Form Error:', error.message);

        res.status(500).json({
            message: 'Failed to load sales information'
        });
    }
};

// Record a sale and reduce stock
exports.addSale = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        const {
            vendor_id,
            payment_method,
            amount_paid = 0,
            items
        } = req.body;

        const validPaymentMethods = [
            'Cash',
            'Mobile Money',
            'Credit'
        ];

        const paidAmount = Number(amount_paid);

        if (
            !Number.isInteger(Number(vendor_id)) ||
            Number(vendor_id) <= 0 ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !validPaymentMethods.includes(payment_method) ||
            !Number.isFinite(paidAmount) ||
            paidAmount < 0
        ) {
            return res.status(400).json({
                message: 'Valid vendor, payment method, amount paid and sale items are required'
            });
        }

        const itemTotals = new Map();

        for (const item of items) {
            if (
                !Number.isInteger(Number(item.fruit_id)) ||
                Number(item.fruit_id) <= 0 ||
                !['Small', 'Medium', 'Large'].includes(item.packaging_size) ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) <= 0
            ) {
                return res.status(400).json({
                    message: 'Each item must have a valid fruit, packaging size and positive quantity'
                });
            }

            const key = `${Number(item.fruit_id)}-${item.packaging_size}`;

            itemTotals.set(
                key,
                (itemTotals.get(key) || 0) + Number(item.quantity)
            );
        }

        await connection.beginTransaction();
        transactionStarted = true;

        const [vendors] = await connection.query(
            'SELECT vendor_id FROM Vendors WHERE vendor_id = ?',
            [vendor_id]
        );

        if (vendors.length === 0) {
            const error = new Error('Vendor not found');
            error.statusCode = 404;
            throw error;
        }

        let totalAmount = 0;
        const saleItems = [];

        for (const item of items) {
            const fruitId = Number(item.fruit_id);
            const quantity = Number(item.quantity);

            const [fruits] = await connection.query(
                'SELECT fruit_id FROM Fruits WHERE fruit_id = ?',
                [fruitId]
            );

            if (fruits.length === 0) {
                throw new Error(`Fruit ID ${fruitId} does not exist`);
            }

            const [costs] = await connection.query(
                `SELECT unit_cost
                 FROM PurchaseDetails
                 WHERE fruit_id = ?
                 AND packaging_size = ?
                 ORDER BY purchase_detail_id DESC
                 LIMIT 1`,
                [fruitId, item.packaging_size]
            );

            if (costs.length === 0) {
                throw new Error(
                    `No purchase price found for fruit ID ${fruitId} (${item.packaging_size})`
                );
            }

            const unitPrice = Number(
                (Number(costs[0].unit_cost) * 1.5).toFixed(2)
            );

            const [stockRows] = await connection.query(
                `SELECT available_quantity
                 FROM Stock
                 WHERE fruit_id = ?
                 AND packaging_size = ?
                 FOR UPDATE`,
                [fruitId, item.packaging_size]
            );

            const requiredQuantity = itemTotals.get(
                `${fruitId}-${item.packaging_size}`
            );

            if (
                stockRows.length === 0 ||
                Number(stockRows[0].available_quantity) < requiredQuantity
            ) {
                throw new Error(
                    `Insufficient stock for fruit ID ${fruitId} (${item.packaging_size})`
                );
            }

            const lineTotal = Number(
                (quantity * unitPrice).toFixed(2)
            );

            totalAmount += lineTotal;

            saleItems.push({
                fruit_id: fruitId,
                packaging_size: item.packaging_size,
                quantity,
                unit_price: unitPrice
            });
        }

        totalAmount = Number(totalAmount.toFixed(2));

        if (paidAmount > totalAmount) {
            const error = new Error(
                'Amount paid cannot be greater than the sale total'
            );
            error.statusCode = 400;
            throw error;
        }

        let paymentStatus = 'UNPAID';

        if (paidAmount === totalAmount) {
            paymentStatus = 'PAID';
        } else if (paidAmount > 0) {
            paymentStatus = 'PARTIALLY_PAID';
        }

        const [saleResult] = await connection.query(
            `INSERT INTO Sales
             (vendor_id, sale_date, payment_status, payment_method, total_amount, amount_paid)
             VALUES (?, CURDATE(), ?, ?, ?, ?)`,
            [
                vendor_id,
                paymentStatus,
                payment_method,
                totalAmount,
                paidAmount
            ]
        );

        const saleId = saleResult.insertId;

        for (const item of saleItems) {
            await connection.query(
                `INSERT INTO SalesDetails
                 (sale_id, fruit_id, packaging_size, quantity, unit_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    saleId,
                    item.fruit_id,
                    item.packaging_size,
                    item.quantity,
                    item.unit_price
                ]
            );

            await connection.query(
                `UPDATE Stock
                 SET available_quantity = available_quantity - ?
                 WHERE fruit_id = ?
                 AND packaging_size = ?`,
                [
                    item.quantity,
                    item.fruit_id,
                    item.packaging_size
                ]
            );
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message: 'Sale recorded and stock updated successfully',
            sale_id: saleId,
            total_amount: totalAmount,
            amount_paid: paidAmount,
            payment_status: paymentStatus,
            payment_method
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Sale rollback failed:', rollbackError.message);
            }
        }

        console.error('Sale Error:', error.message);

        const statusCode = error.statusCode ||
            (
                error.message.includes('Insufficient stock') ||
                error.message.includes('No purchase price found') ||
                error.message.includes('does not exist')
                    ? 400
                    : 500
            );

        return res.status(statusCode).json({
            message: statusCode === 400 || statusCode === 404
                ? 'Sale could not be completed.'
                : 'Internal server error. Please try again later.',
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
