const { db } = require('../config/firebase');
const snackService = require('../services/snackService'); // I should export it properly first? 
// Wait, I exported `new SnackService()` in previous step.

class SnackController {
    async getSnacks(req, res) {
        try {
            // Fetch all snacks, calculate 'profit' for frontend display if needed
            // Profit = (Selling - Buying) * SoldQuantity
            // But logic can be done on frontend or backend.
            // Let's return raw data.
            const snacks = await snackService.getAllSnacks();
            res.status(200).json(snacks);
        } catch (error) {
            console.error('Error fetching snacks:', error);
            res.status(500).json({ message: 'Error fetching snacks' });
        }
    }

    async addSnack(req, res) {
        try {
            // Expects { name, buyingPrice, sellingPrice, quantity }
            const result = await snackService.addStock(req.body);
            res.status(200).json({ message: 'Snack added/updated', snack: result });
        } catch (error) {
            console.error('Error adding snack:', error);
            res.status(500).json({ message: 'Error adding snack' });
        }
    }

    async deductSnack(req, res) {
        try {
            const { items } = req.body; // Array of { name, quantity }
            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ message: 'Items array required' });
            }
            await snackService.deductStock(items);
            res.status(200).json({ message: 'Stock deducted successfully' });
        } catch (error) {
            console.error('Error deducting stock:', error);
            res.status(500).json({ message: error.message || 'Error deducting stock' });
        }
    }
}

// Since snackService was exported as an instance:
// module.exports = new SnackController();
// But I need to verify snackService export.
// In previous file: `module.exports = new SnackService();` (Correct).

// Wait, I need to define the class first, then export instance.
/*
const snackService = require('../services/snackService');

class SnackController {
    // ... methods ...
}

module.exports = new SnackController();
*/

// Let's implement.
module.exports = {
    getSnacks: async (req, res) => {
        try {
            const snapshot = await db.collection('snacks').get();
            const snacks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.status(200).json(snacks);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    addSnack: async (req, res) => {
        try {
            const { name, buyingPrice, sellingPrice, quantity } = req.body;
            if (!name || !buyingPrice || !sellingPrice || !quantity) {
                return res.status(400).json({ message: 'Missing fields' });
            }

            // Check if exists
            const snapshot = await db.collection('snacks').where('name', '==', name).limit(1).get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const current = doc.data();
                const newQty = (current.quantity || 0) + parseInt(quantity);

                await db.collection('snacks').doc(doc.id).update({
                    quantity: newQty,
                    buyingPrice: Number(buyingPrice),
                    sellingPrice: Number(sellingPrice),
                    updatedAt: new Date().toISOString()
                });
            } else {
                await db.collection('snacks').add({
                    name,
                    buyingPrice: Number(buyingPrice),
                    sellingPrice: Number(sellingPrice),
                    quantity: parseInt(quantity),
                    soldQuantity: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            res.status(200).json({ message: 'Stock updated' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    deductStock: async (req, res) => {
        try {
            // items: [{ name: 'Chips', quantity: 2 }]
            const { items } = req.body;
            if (!items || !items.length) return res.status(400).json({ message: 'No items' });

            await db.runTransaction(async (t) => {
                for (const item of items) {
                    const q = db.collection('snacks').where('name', '==', item.name).limit(1);
                    const snap = await t.get(q);
                    if (snap.empty) throw new Error(`Snack ${item.name} not found`);

                    const doc = snap.docs[0];
                    const data = doc.data();

                    if (data.quantity < item.quantity) {
                        throw new Error(`Insufficient stock for ${item.name}`);
                    }

                    t.update(doc.ref, {
                        quantity: data.quantity - item.quantity,
                        soldQuantity: (data.soldQuantity || 0) + item.quantity,
                        updatedAt: new Date().toISOString()
                    });
                }
            });

            res.status(200).json({ message: 'Stock deducted' });
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    },

    deleteSnack: async (req, res) => {
        try {
            const { id } = req.params;
            await db.collection('snacks').doc(id).delete();
            res.status(200).json({ message: 'Snack deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};
