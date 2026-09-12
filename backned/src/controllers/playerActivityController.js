const { db } = require('../config/firebase');

exports.getPlayerActivity = async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ message: "Phone required" });
        }

        let activity = [];

        /* ================= SESSIONS ================= */

        const sessionSnap = await db.collection('sessions')
            .where('contactNumber', '==', phone)
            .get();

        sessionSnap.forEach(doc => {
            const s = doc.data();

            activity.push({
                type: 'session',
                title: s.gameName || "Gaming Session",
                date: s.startTime,
                timestamp: new Date(s.startTime).getTime()
            });
        });


        /* ================= BATTLES ================= */

        const battleSnap = await db.collection('battles')
            .where('status', 'in', ['completed', 'active'])
            .limit(200)
            .get();

        battleSnap.forEach(doc => {
            const b = doc.data();

            const isPlayer = (b.players || []).some(p => p.phone === phone);

            if (isPlayer) {
                const battleType = `${b.config?.matchType || 'Match'} ${b.config?.gameType || ''}`.trim();

                activity.push({
                    type: 'battle',
                    title: battleType,
                    date: b.startTime || b.createdAt,
                    timestamp: new Date(b.startTime || b.createdAt).getTime()
                });
            }
        });


        /* ================= SORT LATEST FIRST ================= */

        activity.sort((a, b) => b.timestamp - a.timestamp);

        res.json(activity);

    } catch (err) {
        console.error("Player activity error:", err);
        res.status(500).json({ message: "Failed to fetch activity" });
    }
};
