
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

const supplierRoutes = require('./routes/supplierRoutes');
const fruitRoutes = require('./routes/fruitRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const stockRoutes = require('./routes/stockRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const salesRoutes = require('./routes/salesRoutes');
const reportRoutes = require('./routes/reportRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.send('Batloung Farm Distribution System API is running!');
});

// API routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/fruits', fruitRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found'
    });
});

// Global error handling
app.use((error, req, res, next) => {
    console.error('Server Error:', error.message);

    res.status(500).json({
        message: 'Internal server error. Please try again later.'
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await db.getConnection();

        console.log('MySQL Database Connected Successfully!');

        connection.release();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

startServer();
