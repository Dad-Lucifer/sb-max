const { db } = require('../config/firebase');

class SnackService {
    // Get all snacks
    async getAllSnacks() {
        const snapshot = await db.collection('snacks').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Add stock (or create new snack)
    async addStock(data) {
        const { name, buyingPrice, sellingPrice, quantity } = data;

        // Check if exists by name
        const snapshot = await db.collection('snacks').where('name', '==', name).limit(1).get();

        let snackRef;
        let newQuantity = parseInt(quantity);
        let finalData;

        if (!snapshot.empty) {
            // Update existing
            const doc = snapshot.docs[0];
            snackRef = db.collection('snacks').doc(doc.id);
            const currentData = doc.data();

            newQuantity += (currentData.quantity || 0);

            finalData = {
                quantity: newQuantity,
                buyingPrice: parseFloat(buyingPrice),
                sellingPrice: parseFloat(sellingPrice),
                updatedAt: new Date().toISOString()
            };

            await snackRef.update(finalData);
        } else {
            // Create New
            finalData = {
                name,
                buyingPrice: parseFloat(buyingPrice),
                sellingPrice: parseFloat(sellingPrice),
                quantity: parseInt(quantity),
                soldQuantity: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            snackRef = await db.collection('snacks').add(finalData);
        }

        return { id: snackRef.id, ...finalData };
    }

    // Deduct stock (Transactional)
    // items: Array of { name, quantity }
    async deductStock(items) {
        if (!items || items.length === 0) return;

        return db.runTransaction(async (transaction) => {
            const reads = [];
            for (const item of items) {
                // Find doc by name
                // Note: performing query inside transaction is tricky in some SDKs, 
                // but usually fine if we stick to strict patterns. 
                // However, Firestore transactions require reads before writes.
                // We'll query first (outside if needed, but better inside to lock).
                // Actually, queries in transactions must be done carefully. 
                // Simpler: Fetch all matching docs first?
                // Or better: Assume we have IDs? We only have names from frontend 'chips'.
                // Ideally frontend sends IDs. 
                // For now, I'll search by name.
                const query = db.collection('snacks').where('name', '==', item.name).limit(1);
                const snapshot = await transaction.get(query);

                if (snapshot.empty) {
                    throw new Error(`Snack '${item.name}' not found in inventory`);
                }

                const doc = snapshot.docs[0];
                const data = doc.data();

                if ((data.quantity || 0) < item.quantity) {
                    throw new Error(`Insufficient stock for '${item.name}'. Available: ${data.quantity}, Requested: ${item.quantity}`);
                }

                reads.push({ ref: doc.ref, data, deduct: item.quantity });
            }

            // Perform updates
            for (const read of reads) {
                const newQty = read.data.quantity - read.deduct;
                const newSold = (read.data.soldQuantity || 0) + read.deduct;
                transaction.update(read.ref, {
                    quantity: newQty,
                    soldQuantity: newSold,
                    updatedAt: new Date().toISOString()
                });
            }

            return reads;
        });
    }

    // Helper to validate check availability without deducting (for frontend check)
    // Actually we can just use getAllSnacks and check locally on frontend, 
    // or provide an endpoint.
}

module.exports = new SnackService();
