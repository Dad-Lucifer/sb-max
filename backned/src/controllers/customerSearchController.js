const { db } = require("../config/firebase");
const { cached } = require("../utils/cache");

exports.searchCustomers = async (req, res) => {
    try {
        const q = (req.query.name || "").toLowerCase().trim();
        if (q.length < 2 || q.length > 40) return res.json([]);

        const firstWord = q.split(/\s+/)[0];
        const results = await cached(`customers:q:${q}`, 60_000, async () => {
            const snap = await db.collection('customers')
                .where('searchKeys', 'array-contains', firstWord.slice(0, 15))
                .limit(20)
                .get();
            return snap.docs
                .map(d => d.data())
                .filter(c => c.nameLower.includes(q))
                .slice(0, 8)
                .map(c => ({ name: c.name, phone: c.phone }));
        });
        res.json(results);
    } catch (err) {
        console.error("Customer search error:", err);
        res.status(500).json({ message: "Customer search failed" });
    }
};
