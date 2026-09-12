const { db } = require('../config/firebase');

/* -------------------------------------------------------------------------- */
/*                                SUBSCRIPTIONS                               */
/* -------------------------------------------------------------------------- */

exports.getSubscriptions = async (req, res) => {
    try {
        const snapshot = await db.collection('management_subscriptions')
            .orderBy('createdAt', 'desc')
            .get();

        const subscriptions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.createSubscription = async (req, res) => {
    try {
        const { type, provider, cost, startDate, expiryDate } = req.body;

        if (!type || !cost || !startDate || !expiryDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newSub = {
            type,
            provider: provider || '',
            cost: Number(cost),
            startDate,
            expiryDate,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('management_subscriptions').add(newSub);

        res.status(201).json({
            id: docRef.id,
            ...newSub
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('management_subscriptions').doc(id).delete();
        res.status(200).json({ message: 'Subscription deleted' });
    } catch (error) {
        console.error('Error deleting subscription:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/* -------------------------------------------------------------------------- */
/*                                  SALARIES                                  */
/* -------------------------------------------------------------------------- */

exports.getSalaries = async (req, res) => {
    try {
        const snapshot = await db.collection('management_salaries')
            .orderBy('paymentDate', 'desc')
            .get();

        const salaries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(salaries);
    } catch (error) {
        console.error('Error fetching salaries:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.createSalary = async (req, res) => {
    try {
        const { employeeName, amount, paymentDate, notes } = req.body;

        if (!employeeName || !amount || !paymentDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newSalary = {
            employeeName,
            amount: Number(amount),
            paymentDate,
            notes: notes || '',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('management_salaries').add(newSalary);

        res.status(201).json({
            id: docRef.id,
            ...newSalary
        });
    } catch (error) {
        console.error('Error creating salary:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteSalary = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('management_salaries').doc(id).delete();
        res.status(200).json({ message: 'Salary record deleted' });
    } catch (error) {
        console.error('Error deleting salary:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
