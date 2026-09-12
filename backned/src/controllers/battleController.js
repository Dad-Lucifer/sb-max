const { db } = require('../config/firebase');
const admin = require('firebase-admin');

// Backend Validation Helper
const validatePlayer = (player) => {
    if (!player || !player.name || !player.phone) return "Missing player details";
    if (player.name.trim().length < 2) return "Name too short";
    if (!/^\d{10}$/.test(player.phone)) return "Invalid phone number (must be 10 digits)";
    return null;
};

const makeSearchablePlayer = (p) => ({
    name: p.name,
    nameLower: p.name.toLowerCase(),
    phone: p.phone
});

// Start a new Battle
exports.startBattle = async (req, res) => {
    try {
        if (!db) {
            console.error('❌ Firestore not initialized');
            return res.status(500).json({ message: 'Database not configured' });
        }

        const { crownHolder, challenger, config } = req.body;

        // 1. Validation
        if (!crownHolder || !challenger) {
            return res.status(400).json({ message: 'Both players are required' });
        }

        const p1Error = validatePlayer(crownHolder);
        if (p1Error) return res.status(400).json({ message: `Player 1: ${p1Error}` });

        const p2Error = validatePlayer(challenger);
        if (p2Error) return res.status(400).json({ message: `Player 2: ${p2Error}` });

        // 2. Sanitization
        const sanitize = (str) => str ? String(str).trim() : '';
        const p1 = {
            name: sanitize(crownHolder.name),
            phone: sanitize(crownHolder.phone),
            teamName: sanitize(crownHolder.teamName),
            score: 0
        };
        const p2 = {
            name: sanitize(challenger.name),
            phone: sanitize(challenger.phone),
            teamName: sanitize(challenger.teamName),
            score: 0
        };

        const battleConfig = {
            gameType: config?.gameType || 'Standard',
            matchType: config?.matchType || 'Solo',
            entryFee: Number(config?.entryFee) || 0
        };

        // 3. Create Record
        const battleData = {
            crownHolder: p1,
            challenger: p2,
            config: battleConfig,
            players: [
        makeSearchablePlayer(p1),
        makeSearchablePlayer(p2)
    ],
 playerSearch: [
        p1.name.toLowerCase(),
        p2.name.toLowerCase()
    ],

            startTime: new Date().toISOString(),
            status: 'active',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('battles').add(battleData);

        const response = {
            id: docRef.id,
            ...battleData
        };

        // 🔔 Socket event
        if (global.io) {
            global.io.emit('battle:started', response);
        }

        console.log('✅ Battle created:', docRef.id);
        res.status(201).json(response);

    } catch (error) {
        console.error('❌ Error starting battle:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Get Active Battles
exports.getActiveBattles = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: 'Database not configured' });

        const snapshot = await db.collection('battles')
            .where('status', '==', 'active')
            .get();

        const battles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        battles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(battles);
    } catch (error) {
        console.error('❌ Error fetching battles:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update Scores
exports.updateScore = async (req, res) => {
    try {
        const { id } = req.params;
        const { player } = req.body;

        if (!['crownHolder', 'challenger'].includes(player)) {
            return res.status(400).json({ message: 'Invalid player type' });
        }

        const battleRef = db.collection('battles').doc(id);
        const doc = await battleRef.get();

        if (!doc.exists) return res.status(404).json({ message: 'Battle not found' });

        // Atomic Increment
        await battleRef.update({
            [`${player}.score`]: admin.firestore.FieldValue.increment(1)
        });

        if (global.io) {
            global.io.emit('battle:scoreUpdated', {
                battleId: id,
                player
            });
        }

        res.status(200).json({ message: 'Score updated' });
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Finish Battle
exports.finishBattle = async (req, res) => {
    try {
        const { id } = req.params;
        const battleRef = db.collection('battles').doc(id);

        // Transaction to ensure data consistency
        await db.runTransaction(async (t) => {
            const doc = await t.get(battleRef);
            if (!doc.exists) throw new Error('Battle not found');

            const battle = doc.data();
            if (battle.status !== 'active') throw new Error('Battle already finished');

            const crownScore = battle.crownHolder.score;
            const chalScore = battle.challenger.score;

            let winnerKey = null;
            if (crownScore > chalScore) winnerKey = 'crownHolder';
            else if (chalScore > crownScore) winnerKey = 'challenger';

            // Update Battle
            t.update(battleRef, {
                status: 'completed',
                endTime: new Date().toISOString(), // Use ISO string for consistency with standard JSON
                winner: winnerKey ? battle[winnerKey].name : 'tie'
            });

            // Award Winner
            if (winnerKey) {
                const winner = battle[winnerKey];
                const winnerRef = db.collection('battelwinner').doc(winner.phone);

                t.set(winnerRef, {
                    name: winner.name,
                    phone: winner.phone,
                    thunderCoins: admin.firestore.FieldValue.increment(15),
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        });

        if (global.io) {
            global.io.emit('battle:finished', { battleId: id });
        }

        res.status(200).json({ message: 'Battle finished successfully' });

    } catch (error) {
        console.error('❌ Error finishing battle:', error);
        const status = error.message === 'Battle not found' ? 404 : 400;
        res.status(status).json({ message: error.message });
    }
};

// Get Completed Battles
exports.getCompletedBattles = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: 'Database not configured' });

        const snapshot = await db.collection('battles')
            .where('status', '==', 'completed')
            .limit(100)
            .get();

        const battles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        battles.sort((a, b) => {
            const timeA = new Date(a.endTime || a.createdAt || a.startTime || 0).getTime();
            const timeB = new Date(b.endTime || b.createdAt || b.startTime || 0).getTime();
            return timeB - timeA;
        });

        res.status(200).json(battles);
    } catch (error) {
        console.error('❌ Error fetching completed battles:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getThunderLeaderboard = async (req, res) => {
    try {
        const snapshot = await db.collection('battelwinner')
            .orderBy('thunderCoins', 'desc')
            .limit(10)
            .get();
        const data = snapshot.docs.map(doc => doc.data());
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
};

exports.getThunderPlayer = async (req, res) => {
    try {
        const { name, phone } = req.query;
        if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });

        const doc = await db.collection('battelwinner').doc(phone).get();

        // If player doesn't exist, return 0 coins instead of 404 to avoid frontend errors
        if (!doc.exists) {
            return res.status(200).json({
                name,
                phone,
                thunderCoins: 0,
                isNew: true
            });
        }

        const data = doc.data();
        // Case insensitive name check
        if (data.name.toLowerCase() !== name.toLowerCase()) {
            // Phone matches but name doesn't? treat as new or 0 to be safe
            // Or maybe just return the data associated with phone?
            // Let's assume strict match needed.
            return res.status(200).json({
                name,
                phone,
                thunderCoins: 0,
                warning: 'Phone registered to different name'
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching thunder player:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
