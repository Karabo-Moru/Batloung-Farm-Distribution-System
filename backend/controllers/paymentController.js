
const db = require('../config/db');

// Record a payment from a vendor
exports.addPayment = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { sale_id, amount } = req.body;
        const paymentAmount = Number(amount);
        const saleId = Number(sale_id);

        if (
            !Number.isInteger(saleId) ||
            saleId <= 0 ||
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {
            return res.status(400).json({
                message: 'A valid sale ID and payment amount greater than zero are required'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [sales] = await connection.query(
            `SELECT sale_id, total_amount, amount_paid
             FROM Sales
             WHERE sale_id = ?
             FOR UPDATE`,
            [saleId]
        );

        if (sales.length === 0) {
            const error = new Error('Sale not found');
            error.statusCode = 404;
            throw error;
        }

        const sale = sales[0];
        const totalAmount = Number(sale.total_amount);
        const currentPaid = Number(sale.amount_paid);

        const outstandingBalance = Number(
            (totalAmount - currentPaid).toFixed(2)
        );

        if (paymentAmount > outstandingBalance) {
            const error = new Error(
                `Payment exceeds outstanding balance of ${outstandingBalance}`
            );
            error.statusCode = 400;
            throw error;
        }

        const newAmountPaid = Number(
            (currentPaid + paymentAmount).toFixed(2)
        );

        let paymentStatus = 'UNPAID';

        if (newAmountPaid >= totalAmount) {
            paymentStatus = 'PAID';
        } else if (newAmountPaid > 0) {
            paymentStatus = 'PARTIALLY_PAID';
        }

        await connection.query(
            `UPDATE Sales
             SET amount_paid = ?, payment_status = ?
             WHERE sale_id = ?`,
            [newAmountPaid, paymentStatus, saleId]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            message: 'Payment recorded successfully',
            sale_id: saleId,
            total_amount: totalAmount,
            amount_paid: newAmountPaid,
            outstanding_balance: Number(
                (totalAmount - newAmountPaid).toFixed(2)
            ),
            payment_status: paymentStatus
        });

    } catch (error) {
        console.error('Payment Error:', error.message);

        if (connection && transactionStarted) {
            try {
                await connection.rollback();
                transactionStarted = false;
            } catch (rollbackError) {
                console.error('Payment rollback failed:', rollbackError.message);
            }
        }

        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500
                ? 'Payment could not be recorded. Please try again later.'
                : error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Get sales with outstanding balances
exports.getOutstandingSales = async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT
                s.sale_id,
                s.sale_date,
                s.total_amount,
                s.amount_paid,
                (s.total_amount - s.amount_paid) AS outstanding_balance,
                s.payment_status,
                s.payment_method,
                v.vendor_id,
                v.vendor_name
             FROM Sales s
             JOIN Vendors v ON s.vendor_id = v.vendor_id
             WHERE s.amount_paid < s.total_amount
             ORDER BY s.sale_date DESC, s.sale_id DESC`
        );

        return res.json(results);

    } catch (error) {
        console.error('Outstanding Sales Error:', error.message);

        return res.status(500).json({
            message: 'Could not retrieve outstanding sales'
        });
    }
};

// Get vendor balances
exports.getVendorBalances = async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT
                v.vendor_id,
                v.vendor_name,
                COALESCE(SUM(s.total_amount), 0) AS total_sales,
                COALESCE(SUM(s.amount_paid), 0) AS total_paid,
                COALESCE(
                    SUM(s.total_amount - s.amount_paid),
                    0
                ) AS outstanding_balance
             FROM Vendors v
             LEFT JOIN Sales s ON v.vendor_id = s.vendor_id
             GROUP BY v.vendor_id, v.vendor_name
             ORDER BY outstanding_balance DESC`
        );

        return res.json(results);

    } catch (error) {
        console.error('Vendor Balances Error:', error.message);

        return res.status(500).json({
            message: 'Could not retrieve vendor balances'
        });
    }
};
