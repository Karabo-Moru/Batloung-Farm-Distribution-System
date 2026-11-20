
const db = require('../config/db');

// Get all suppliers
exports.getSuppliers = async (req, res) => {
    try {
        const [suppliers] = await db.query(
            'SELECT * FROM suppliers ORDER BY supplier_id DESC'
        );

        return res.status(200).json(suppliers);

    } catch (error) {
        console.error('Get Suppliers Error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve suppliers'
        });
    }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        const [suppliers] = await db.query(
            'SELECT * FROM suppliers WHERE supplier_id = ?',
            [id]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        return res.status(200).json(suppliers[0]);

    } catch (error) {
        console.error('Get Supplier By ID Error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve supplier'
        });
    }
};

// Add a supplier
exports.addSupplier = async (req, res) => {
    try {
        const {
            business_name,
            contact_person,
            phone,
            province,
            address
        } = req.body;

        if (
            !business_name?.trim() ||
            !contact_person?.trim() ||
            !phone?.trim() ||
            !province?.trim() ||
            !address?.trim()
        ) {
            return res.status(400).json({
                message: 'All supplier fields are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO suppliers
            (business_name, contact_person, phone, province, address)
            VALUES (?, ?, ?, ?, ?)`,
            [
                business_name.trim(),
                contact_person.trim(),
                phone.trim(),
                province.trim(),
                address.trim()
            ]
        );

        return res.status(201).json({
            message: 'Supplier added successfully',
            supplier_id: result.insertId
        });

    } catch (error) {
        console.error('Add Supplier Error:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'A supplier with this phone number already exists'
            });
        }

        return res.status(500).json({
            message: 'Failed to add supplier'
        });
    }
};

// Update a supplier
exports.updateSupplier = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            business_name,
            contact_person,
            phone,
            province,
            address
        } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        if (
            !business_name?.trim() ||
            !contact_person?.trim() ||
            !phone?.trim() ||
            !province?.trim() ||
            !address?.trim()
        ) {
            return res.status(400).json({
                message: 'All supplier fields are required'
            });
        }

        const [result] = await db.query(
            `UPDATE suppliers
            SET business_name = ?,
                contact_person = ?,
                phone = ?,
                province = ?,
                address = ?
            WHERE supplier_id = ?`,
            [
                business_name.trim(),
                contact_person.trim(),
                phone.trim(),
                province.trim(),
                address.trim(),
                id
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                'SELECT supplier_id FROM suppliers WHERE supplier_id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: 'Supplier not found'
                });
            }
        }

        return res.status(200).json({
            message: 'Supplier updated successfully'
        });

    } catch (error) {
        console.error('Update Supplier Error:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'A supplier with this phone number already exists'
            });
        }

        return res.status(500).json({
            message: 'Failed to update supplier'
        });
    }
};

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        const [result] = await db.query(
            'DELETE FROM suppliers WHERE supplier_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        return res.status(200).json({
            message: 'Supplier deleted successfully'
        });

    } catch (error) {
        console.error('Delete Supplier Error:', error.message);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message: 'This supplier cannot be deleted because purchase records are linked to it'
            });
        }

        return res.status(500).json({
            message: 'Failed to delete supplier'
        });
    }
};
