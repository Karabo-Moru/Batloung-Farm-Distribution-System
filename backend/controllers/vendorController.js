
const db = require('../config/db');

// Get all vendors
exports.getVendors = async (req, res) => {
    try {
        const [vendors] = await db.query(
            'SELECT * FROM vendors ORDER BY vendor_id DESC'
        );

        return res.status(200).json(vendors);
    } catch (error) {
        console.error('Get vendors error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve vendors'
        });
    }
};

// Register a vendor
exports.addVendor = async (req, res) => {
    try {
        const { vendor_name, phone_number, location } = req.body;

        if (
            !vendor_name?.trim() ||
            !phone_number?.trim() ||
            !location?.trim()
        ) {
            return res.status(400).json({
                message: 'Vendor name, phone number and location are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO vendors (vendor_name, phone_number, location)
             VALUES (?, ?, ?)`,
            [
                vendor_name.trim(),
                phone_number.trim(),
                location.trim()
            ]
        );

        return res.status(201).json({
            message: 'Vendor registered successfully',
            vendor_id: result.insertId
        });
    } catch (error) {
        console.error('Add vendor error:', error);

        return res.status(500).json({
            message: 'Failed to register vendor'
        });
    }
};

// Search vendors by name, phone number or location
exports.searchVendors = async (req, res) => {
    try {
        const { search } = req.query;

        if (typeof search !== 'string' || !search.trim()) {
            return res.status(400).json({
                message: 'Please provide a search term'
            });
        }

        const searchTerm = `%${search.trim()}%`;

        const [vendors] = await db.query(
            `SELECT * FROM vendors
             WHERE vendor_name LIKE ?
             OR phone_number LIKE ?
             OR location LIKE ?`,
            [searchTerm, searchTerm, searchTerm]
        );

        return res.status(200).json(vendors);
    } catch (error) {
        console.error('Search vendors error:', error);

        return res.status(500).json({
            message: 'Failed to search vendors'
        });
    }
};

// Update vendor details
exports.updateVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendor_name, phone_number, location } = req.body;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                message: 'Invalid vendor ID'
            });
        }

        if (
            !vendor_name?.trim() ||
            !phone_number?.trim() ||
            !location?.trim()
        ) {
            return res.status(400).json({
                message: 'All vendor fields are required'
            });
        }

        const [result] = await db.query(
            `UPDATE vendors
             SET vendor_name = ?, phone_number = ?, location = ?
             WHERE vendor_id = ?`,
            [
                vendor_name.trim(),
                phone_number.trim(),
                location.trim(),
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Vendor not found'
            });
        }

        return res.status(200).json({
            message: 'Vendor updated successfully'
        });
    } catch (error) {
        console.error('Update vendor error:', error);

        return res.status(500).json({
            message: 'Failed to update vendor'
        });
    }
};
