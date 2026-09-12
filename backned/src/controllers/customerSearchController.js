const { db } = require("../config/firebase");

/**
 * Search customers from sessions + bookings + battles
 * Returns unique { name, phone }
 */
exports.searchCustomers = async (req, res) => {
    try {
        const query = (req.query.name || "").toLowerCase().trim();

        if (query.length < 2) {
            return res.json([]);
        }

        const collections = ["sessions", "bookings", "battles"];
        const customers = new Map();

        for (const col of collections) {
            const snapshot = await db.collection(col).get();

            snapshot.forEach(doc => {
                const data = doc.data() || {};

                // ---- sessions & bookings ----
                if (data.customerName && data.contactNumber) {
                    if (data.customerName.toLowerCase().includes(query)) {
                        customers.set(data.contactNumber, {
                            name: data.customerName,
                            phone: data.contactNumber
                        });
                    }
                }

                // ---- battles crownHolder ----
                if (data.crownHolder && data.crownHolder.name && data.crownHolder.phone) {
                    if (data.crownHolder.name.toLowerCase().includes(query)) {
                        customers.set(data.crownHolder.phone, {
                            name: data.crownHolder.name,
                            phone: data.crownHolder.phone
                        });
                    }
                }

                // ---- battles challenger ----
                if (data.challenger && data.challenger.name && data.challenger.phone) {
                    if (data.challenger.name.toLowerCase().includes(query)) {
                        customers.set(data.challenger.phone, {
                            name: data.challenger.name,
                            phone: data.challenger.phone
                        });
                    }
                }
            });
        }

        return res.json(Array.from(customers.values()).slice(0, 8));

    } catch (err) {
        console.error("Customer search error:", err);
        res.status(500).json({ message: "Customer search failed" });
    }
};
