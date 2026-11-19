
const db = require('../config/db');

// Report 1: Five most sold fruits
exports.getTopFruits = async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT
                f.fruit_name,
                SUM(sd.quantity) AS total_sold
             FROM SalesDetails sd
             JOIN Fruits f ON sd.fruit_id = f.fruit_id
             GROUP BY f.fruit_id, f.fruit_name
             ORDER BY total_sold DESC
             LIMIT 5`
        );

        return res.json(results);

    } catch (error) {
        console.error('Top Fruits Report Error:', error.message);

        return res.status(500).json({
            message: 'Could not retrieve top fruits report'
        });
    }
};

// Report 2: Revenue within a date range
exports.getRevenueReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                message: 'Start date and end date are required'
            });
        }

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(start_date) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(end_date) ||
            start_date > end_date
        ) {
            return res.status(400).json({
                message: 'Please provide valid dates in YYYY-MM-DD format'
            });
        }

        const [results] = await db.query(
            `SELECT
                COUNT(*) AS total_sales,
                COALESCE(SUM(total_amount), 0) AS total_revenue
             FROM Sales
             WHERE sale_date BETWEEN ? AND ?`,
            [start_date, end_date]
        );

        return res.json(results[0]);

    } catch (error) {
        console.error('Revenue Report Error:', error.message);

        return res.status(500).json({
            message: 'Could not retrieve revenue report'
        });
    }
};

// Report 3: Vendor who bought the most boxes
exports.getTopVendor = async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT
                v.vendor_id,
                v.vendor_name,
                SUM(sd.quantity) AS total_boxes
             FROM SalesDetails sd
             JOIN Sales s ON sd.sale_id = s.sale_id
             JOIN Vendors v ON s.vendor_id = v.vendor_id
             GROUP BY v.vendor_id, v.vendor_name
             ORDER BY total_boxes DESC
             LIMIT 1`
        );

        return res.json(results[0] || {
            message: 'No sales records found'
        });

    } catch (error) {
        console.error('Top Vendor Report Error:', error.message);

        return res.status(500).json({
            message: 'Could not retrieve top vendor report'
        });
    }
};

// Report 4: Current stock by fruit and packaging size
exports.getStockReport = async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT
                f.fruit_name,
                st.packaging_size,
                st.available_quantity
             FROM Stock st
             JOIN Fruits f ON st.fruit_id = f.fruit_id
             ORDER BY f.fruit_name, st.packaging_size`
        );

        return res.json(results);

    } catch (error) {
        console.error('Stock Report Error:', error.message);

        return res.status(500).json({
            message: 'Could not retrieve stock report'
        });
    }
};
