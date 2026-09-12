const { db } = require('../config/firebase');
const deviceLimits = require("../config/deviceLimit");
const { calculateSessionPrice, isHappyHourTime, isFunNightTime, isNormalHourTime } = require('../utils/pricing');
const snackService = require('../services/snackService'); // Import SnackService

// Helper to transform device counts object to array of objects for frontend
const transformDevicesToArray = (deviceData) => {
    const devices = [];
    if (!deviceData) return devices;

    Object.entries(deviceData).forEach(([type, value]) => {
        // Handle array of IDs (New format: { ps: [1, 2] })
        if (Array.isArray(value)) {
            value.forEach(id => devices.push({ type, id }));
        }
        // Handle legacy number count (Old format: { ps: 2 })
        // For legacy, we don't have IDs, so we might just pass type and maybe a placeholder ID or null
        // However, converting legacy data to specific IDs is impossible without data loss, 
        // but for display "PS5" without ID is fine.
        else if (typeof value === 'number') {
            for (let i = 0; i < value; i++) {
                devices.push({ type, id: null }); // No specific ID
            }
        }
    });
    return devices.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return (a.id || 0) - (b.id || 0);
    });
};

// Helper to get Pricing Config
const getPricingConfig = async () => {
    const { getDefaultPricingConfig } = require('./pricingController');
    const defaults = getDefaultPricingConfig();
    try {
        const doc = await db.collection('settings').doc('pricing').get();
        if (doc.exists) {
            const data = doc.data();
            // Shallow merge of top sections (monWedPrices, etc.)
            const merged = { ...defaults };
            Object.keys(data).forEach(key => {
                if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
                    merged[key] = { ...merged[key], ...data[key] };
                } else {
                    merged[key] = data[key];
                }
            });
            return merged;
        }
    } catch (err) {
        console.error("Error fetching pricing for controller logic:", err);
    }
    return defaults;
};

const getDeviceAvailability = async (req, res) => {
    try {
        const snapshot = await db
            .collection('sessions')
            .where('status', '==', 'active')
            .get();

        const bookingsSnapshot = await db
            .collection('bookings')
            .where('status', '==', 'upcoming')
            .get();

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        snapshot.forEach(doc => {
            const devices = doc.data().devices || {};
            // devices: { ps: 5 } means PS Machine #5 is used.
            Object.keys(devices).forEach(k => {
                const val = devices[k];
                if (Array.isArray(val)) {
                    val.forEach(id => {
                        if (id > 0 && occupied[k] && !occupied[k].includes(id)) occupied[k].push(id);
                    });
                } else if (typeof val === 'number' && val > 0 && occupied[k] && !occupied[k].includes(val)) {
                    occupied[k].push(val);
                }
            });
        });

        const requestStart = new Date();
        const requestEnd = new Date(requestStart.getTime() + 1 * 60 * 60 * 1000); // 1 hr window

        bookingsSnapshot.forEach(doc => {
            const bData = doc.data();
            const bStart = bData.bookingTime?.toDate ? bData.bookingTime.toDate() : new Date(bData.bookingTime);
            const bEnd = bData.bookingEndTime?.toDate ? bData.bookingEndTime.toDate() : new Date(bData.bookingEndTime || bStart.getTime() + 60 * 60 * 1000);
            
            if (bStart < requestEnd && bEnd > requestStart) {
                const devices = bData.devices || {};
                Object.keys(devices).forEach(k => {
                    const val = devices[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => {
                            if (id > 0 && occupied[k] && !occupied[k].includes(id)) occupied[k].push(id);
                        });
                    } else if (typeof val === 'number' && val > 0 && occupied[k] && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        res.status(200).json({
            limits: deviceLimits,
            occupied
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Availability error' });
    }
};


const createSession = async (req, res) => {
    try {
        const {
            customerName, contactNumber, duration,
            peopleCount, snacks, devices, price, snackDetails, thunderCoinsUsed = 0, gameName
        } = req.body;

        // Deduct snacks if provided
        if (snackDetails && Array.isArray(snackDetails) && snackDetails.length > 0) {
            await snackService.deductStock(snackDetails);
        } else if (snacks && Array.isArray(snacks)) {
            // Handle case where snacks is sent as array directly (consistency)
            await snackService.deductStock(snacks);
        }

        // 1. Get currently occupied IDs
        const snapshot = await db
            .collection('sessions')
            .where('status', '==', 'active')
            .get();

        const bookingsSnapshot = await db
            .collection('bookings')
            .where('status', '==', 'upcoming')
            .get();

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        snapshot.forEach(doc => {
            const d = doc.data().devices || {};
            Object.keys(d).forEach(k => {
                const val = d[k];
                if (Array.isArray(val)) {
                    val.forEach(id => {
                        if (id > 0 && occupied[k] && !occupied[k].includes(id)) occupied[k].push(id);
                    });
                } else if (typeof val === 'number' && val > 0 && occupied[k] && !occupied[k].includes(val)) {
                    occupied[k].push(val);
                }
            });
        });

        // Calculate base price and duration logic first
        const durationVal = parseFloat(duration) || 1;
        const peopleVal = parseInt(peopleCount) || 1;
        const devicesVal = devices || {};

        const requestStart = new Date();
        const requestEnd = new Date(requestStart.getTime() + durationVal * 60 * 60 * 1000);

        bookingsSnapshot.forEach(doc => {
            const bData = doc.data();
            const bStart = bData.bookingTime?.toDate ? bData.bookingTime.toDate() : new Date(bData.bookingTime);
            const bEnd = bData.bookingEndTime?.toDate ? bData.bookingEndTime.toDate() : new Date(bData.bookingEndTime || bStart.getTime() + 60 * 60 * 1000);
            
            if (bStart < requestEnd && bEnd > requestStart) {
                const d = bData.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => {
                            if (id > 0 && occupied[k] && !occupied[k].includes(id)) occupied[k].push(id);
                        });
                    } else if (typeof val === 'number' && val > 0 && occupied[k] && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        const pricingConfig = await getPricingConfig();
        const basePrice = calculateSessionPrice(
            durationVal,
            peopleVal,
            devicesVal,
            new Date(),
            pricingConfig
        );

        // Use the price sent from frontend (which includes snacks) or fallback to calculated base
        const finalPrice = price ? parseFloat(price) : basePrice;

        // 2. Validate availability (Check if ID is taken)
        // devicesVal is expected to be { ps: [1, 2] }
        for (const key in devicesVal) {
            const val = devicesVal[key];
            const requestedIds = Array.isArray(val) ? val : (typeof val === 'number' && val > 0 ? [val] : []);

            for (const requestedId of requestedIds) {
                if (requestedId > 0) {
                    // Check if ID is within limits
                    if (requestedId > deviceLimits[key]) {
                        return res.status(400).json({
                            message: `${key.toUpperCase()} #${requestedId} does not exist (Max ${deviceLimits[key]})`
                        });
                    }
                    // Check if ID is occupied
                    if (occupied[key].includes(requestedId)) {
                        return res.status(400).json({
                            message: `${key.toUpperCase()} #${requestedId} is currently occupied`
                        });
                    }
                }
            }
        }

        // 3. Create session
        const newSession = {
            customerName,
            customerNameLower: customerName.toLowerCase(),
            contactNumber,
            duration: durationVal,
            peopleCount: peopleVal,
            gameName,
            snacks: snackDetails || snacks || [],
            devices: devicesVal, // Store as is (arrays)
            price: finalPrice,
            paidAmount: 0,
            cash: 0,
            online: 0,
            remainingPeople: peopleVal,  // Initially all people are remaining
            remainingAmount: finalPrice,  // Initially full amount is remaining
            status: 'active',
            startTime: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };


        const docRef = await db.collection('sessions').add(newSession);
        // ================= THUNDER COIN DEDUCTION =================
        if (thunderCoinsUsed > 0 && contactNumber) {
            try {
                const playerRef = db.collection('battelwinner').doc(contactNumber);
                const playerSnap = await playerRef.get();

                if (playerSnap.exists) {
                    const currentCoins = playerSnap.data().thunderCoins || 0;

                    // prevent cheating (frontend manipulation safety)
                    const safeDeduction = Math.min(currentCoins, thunderCoinsUsed);

                    await playerRef.update({
                        thunderCoins: currentCoins - safeDeduction,
                        updatedAt: new Date().toISOString()
                    });

                    console.log(`⚡ Deducted ${safeDeduction} coins from ${contactNumber}`);
                }
            } catch (coinErr) {
                console.error("Thunder coin deduction failed:", coinErr);
            }
        }


        global.io.emit('session:started', {
            id: docRef.id,
            customer: customerName,
            startTime: newSession.startTime,
            duration: newSession.duration,
            peopleCount: newSession.peopleCount,
            price: newSession.price,
            remainingAmount: newSession.remainingAmount,
            devices: transformDevicesToArray(newSession.devices),
            status: 'active'
        });

        res.status(201).json({
            message: 'Session started successfully',
            sessionId: docRef.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error starting session' });
    }
};

const getActiveSessions = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: 'Database not initialized' });

        const snapshot = await db.collection('sessions')
            .where('status', '==', 'active')
            .get();

        const sessions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Transform for frontend
            // Frontend expects: { id, customer, startTime, devices: ['ps', 'ps'], status }

            // Basic formatting of time (just showing time part for now or full string)
            const startDate = new Date(data.startTime);
            const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            sessions.push({
                id: doc.id,
                customer: data.customerName,
                startTime: data.startTime,   // ISO string
                duration: data.duration,     // hours
                peopleCount: data.peopleCount,
                snacks: Array.isArray(data.snacks) ? data.snacks : [],
                price: data.price,
                gameName: data.gameName,
                paidAmount: data.paidAmount || 0,
                remainingPeople: data.remainingPeople ?? data.peopleCount,
                remainingAmount: data.remainingAmount ?? data.price,
                devices: transformDevicesToArray(data.devices), // Now returns objects
                status: data.status
            });

        });

        res.status(200).json(sessions);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sessions' });
    }
};

const createBooking = async (req, res) => {
    try {
        const { customerName, contactNumber, peopleCount, bookingTime, bookingEndTime, devices } = req.body;
        // bookingTime, bookingEndTime expected ISO string

        if (!db) return res.status(500).json({ message: 'Database not initialized' });

        const start = new Date(bookingTime);
        const end = new Date(bookingEndTime);

        // 1. Validate Availability for the requested time slot
        // We need to check if requested devices are already taken in this slot

        // Validation: Total devices cannot exceed total people
        let totalRequested = 0;
        Object.keys(devices || {}).forEach(k => {
            const val = devices[k];
            if (Array.isArray(val)) totalRequested += val.length;
            // handle number case if strictly needed, but payload is usually arrays now
        });

        // peopleCount might be string or number
        const pCount = parseInt(peopleCount) || 1;
        if (totalRequested > pCount) {
            return res.status(400).json({ message: `Cannot book ${totalRequested} devices for ${pCount} people.` });
        }

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        // Check Active Sessions
        const activeSessions = await db.collection('sessions').where('status', '==', 'active').get();
        activeSessions.forEach(doc => {
            const s = doc.data();
            const sStart = new Date(s.startTime);
            const sEnd = new Date(sStart.getTime() + (s.duration || 1) * 60 * 60 * 1000);

            // Overlap check
            if (sStart < end && sEnd > start) {
                const d = s.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k]; // { ps: [1, 2] } or { ps: 1 }
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id && !occupied[k].includes(id)) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0 && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // Check Upcoming Bookings
        const bookings = await db.collection('bookings').where('status', '==', 'upcoming').get();
        bookings.forEach(doc => {
            const b = doc.data();
            const bStart = b.bookingTime?.toDate ? b.bookingTime.toDate() : new Date(b.bookingTime);
            const bEnd = b.bookingEndTime?.toDate ? b.bookingEndTime.toDate() : new Date(b.bookingEndTime || bStart.getTime() + 60 * 60 * 1000);

            if (bStart < end && bEnd > start) {
                const d = b.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id && !occupied[k].includes(id)) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0 && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // Verify loaded devices are free and valid
        for (const type of Object.keys(devices || {})) {
            const requestedIds = devices[type]; // [1, 2]
            if (Array.isArray(requestedIds)) {
                for (const id of requestedIds) {
                    // Check if ID is within physical limits
                    if (deviceLimits[type] && id > deviceLimits[type]) {
                        return res.status(400).json({ message: `${type.toUpperCase()} #${id} does not exist (Max ${deviceLimits[type]})` });
                    }

                    if (occupied[type] && occupied[type].includes(id)) {
                        return res.status(400).json({ message: `${type.toUpperCase()} #${id} is not available at this time.` });
                    }
                }
            }
        }

        const newBooking = {
            customerName,
            customerNameLower: customerName.toLowerCase(),
            contactNumber: contactNumber || '',
            bookingTime,
            bookingEndTime: bookingEndTime || null,
            peopleCount: peopleCount || 1,
            devices: devices || {}, // { ps: [1, 2] ... }
            status: 'upcoming',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('bookings').add(newBooking);
        res.status(201).json({ message: 'Booking created', bookingId: docRef.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating booking' });
    }
};

const getUpcomingBookings = async (req, res) => {
    try {
        const snapshot = await db
            .collection('bookings')
            .where('status', '==', 'upcoming')
            .get();

        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            const bookingDate = data.bookingTime?.toDate ? data.bookingTime.toDate() : new Date(data.bookingTime);
            const endDate = data.bookingEndTime ? (data.bookingEndTime.toDate ? data.bookingEndTime.toDate() : new Date(data.bookingEndTime)) : null;

            let duration = 0;
            if (endDate) {
                duration = (endDate - bookingDate) / (1000 * 60 * 60);
            }

            return {
                id: doc.id,
                name: data.customerName,
                time: bookingDate.toISOString(),
                endTime: endDate ? endDate.toISOString() : null,
                duration: duration > 0 ? parseFloat(duration.toFixed(1)) : 0,
                devices: transformDevicesToArray(data.devices || {}), // Returns [{ type, id }]
                peopleCount: data.peopleCount
            };
        });

        // Sort in memory to avoid requiring a composite index in Firestore
        bookings.sort((a, b) => new Date(a.time) - new Date(b.time));

        return res.status(200).json(bookings);

    } catch (error) {
        console.error('❌ getUpcomingBookings error:', error);
        return res.status(500).json({ message: 'Error fetching bookings' });
    }
};

const exportSessions = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: 'Database not initialized' });

        // Fetch last 2000 sessions (active & completed)
        const snapshot = await db.collection('sessions')
            .orderBy('createdAt', 'desc')
            .limit(2000)
            .get();

        const pricingConfigExport = await getPricingConfig();

        const data = snapshot.docs.map(doc => {
            const s = doc.data();
            const startStr = s.startTime;
            const startTime = startStr ? (s.startTime.toDate ? s.startTime.toDate() : new Date(startStr)) : null;

            // Determine Time Category
            let timeCategory = 'Unknown';
            if (startTime && pricingConfigExport) {
                if (isFunNightTime(startTime, pricingConfigExport)) timeCategory = 'Fun Night';
                else if (isNormalHourTime(startTime, pricingConfigExport)) timeCategory = 'Normal Hour';
                else if (isHappyHourTime(startTime, pricingConfigExport)) timeCategory = 'Happy Hour';
                else timeCategory = 'Happy Hour';
            }

            // Session Renewed logic
            const isRenewed = (s.members && s.members.length > 0) || (s.updatedAt && s.updatedAt !== s.createdAt);

            // Format snacks
            let snacksStr = 'None';
            if (s.snacks && Array.isArray(s.snacks) && s.snacks.length > 0) {
                snacksStr = s.snacks.map(snack => `${snack.name} (${snack.quantity})`).join(', ');
            }

            // Format devices
            let devicesStr = 'None';
            if (s.devices && typeof s.devices === 'object') {
                const deviceParts = [];
                Object.entries(s.devices).forEach(([type, ids]) => {
                    if (Array.isArray(ids) && ids.length > 0) {
                        const typeLabel = type.toUpperCase();
                        ids.forEach(id => {
                            if (id) deviceParts.push(`${typeLabel}${id}`);
                        });
                    }
                });
                devicesStr = deviceParts.length > 0 ? deviceParts.join(', ') : 'None';
            }

            return {
                "Session Entry": startTime ? startTime.toISOString() : 'N/A',
                "Date": startTime ? startTime.toLocaleDateString() : 'N/A',
                "Time": startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                "Name": s.customerName || 'N/A',
                "Phone Number": s.contactNumber || 'N/A',
                "Devices": devicesStr,
                "Duration": (() => {
                const hrs = s.duration || 0;
                const h = Math.floor(hrs);
                const m = Math.round((hrs - h) * 60);
                return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
            })(),
                "Snacks": snacksStr,
                "Session Renewed": isRenewed ? "Yes" : "No",
                "Total Amount": s.price || 0,
                "Cash": s.cash || 0,
                "Online": s.online || 0,
                "Joined During": timeCategory
            };
        });

        res.status(200).json(data);

    } catch (error) {
        console.error('❌ Export sessions error:', error);
        res.status(500).json({ message: 'Failed to export sessions' });
    }
};

// Get device availability for a specific time range
const getDeviceAvailabilityForTime = async (req, res) => {
    try {
        const { startTime, endTime } = req.query;

        if (!startTime || !endTime) {
            return res.status(400).json({ message: 'startTime and endTime are required' });
        }

        const requestStart = new Date(startTime);
        const requestEnd = new Date(endTime);

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        // 1. Check Active Sessions
        const activeSessions = await db.collection('sessions').where('status', '==', 'active').get();
        activeSessions.forEach(doc => {
            const session = doc.data();
            const sStart = new Date(session.startTime);
            const duration = session.duration || 1;
            const sEnd = new Date(sStart.getTime() + duration * 60 * 60 * 1000);

            if (sStart < requestEnd && sEnd > requestStart) {
                const d = session.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id && !occupied[k].includes(id)) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0 && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // 2. Check Upcoming Bookings
        const upcomingBookings = await db.collection('bookings').where('status', '==', 'upcoming').get();
        upcomingBookings.forEach(doc => {
            const b = doc.data();
            const bStart = b.bookingTime?.toDate ? b.bookingTime.toDate() : new Date(b.bookingTime);
            const bEnd = b.bookingEndTime?.toDate ? b.bookingEndTime.toDate() : new Date(b.bookingEndTime || bStart.getTime() + 60 * 60 * 1000);

            if (bStart < requestEnd && bEnd > requestStart) {
                const d = b.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id && !occupied[k].includes(id)) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0 && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // Sort occupied arrays
        Object.keys(occupied).forEach(k => occupied[k].sort((a, b) => a - b));

        return res.status(200).json({ limits: deviceLimits, occupied });

    } catch (error) {
        console.error('❌ getDeviceAvailabilityForTime error:', error);
        return res.status(500).json({ message: 'Error fetching time-based availability' });
    }
};

const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { extraTime, extraPrice, newMember, paidNow, payingPeopleNow, snacks, paymentMode, cashCount, onlineCount, addedPeopleCorrection, returnedSnacks } = req.body;



        // Deduct snacks for update


        const ref = db.collection('sessions').doc(id);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ message: "Session not found" });
        }

        const data = snap.data();

        // Merge old snacks + new snacks
        const existingSnacks = data.snacks || [];

        let updatedSnacks = [...existingSnacks];

        if (snacks && Array.isArray(snacks) && snacks.length > 0) {
            snacks.forEach(newSnack => {
                const existing = updatedSnacks.find(s => s.name === newSnack.name);

                if (existing) {
                    existing.quantity += newSnack.quantity;
                } else {
                    updatedSnacks.push({
                        name: newSnack.name,
                        quantity: newSnack.quantity
                    });
                }
            });
        }
        if (returnedSnacks && Array.isArray(returnedSnacks) && returnedSnacks.length > 0) {

            returnedSnacks.forEach(returned => {

                const existing = updatedSnacks.find(s => s.name === returned.name);

                if (existing) {
                    existing.quantity -= returned.quantity;

                    if (existing.quantity <= 0) {
                        updatedSnacks = updatedSnacks.filter(s => s.name !== returned.name);
                    }
                }

            });

        }

        // ---- Safe device merge ----
        let updatedDevices = { ...data.devices };
        let addedPeople = 0;

        if (newMember && newMember.devices) {
            Object.keys(newMember.devices).forEach(k => {
                const existingVal = updatedDevices[k];
                const newVal = newMember.devices[k];

                const existingArr = Array.isArray(existingVal) ? existingVal : (typeof existingVal === 'number' && existingVal > 0 ? [existingVal] : []);
                const newArr = Array.isArray(newVal) ? newVal : (typeof newVal === 'number' && newVal > 0 ? [newVal] : []);

                const merged = [...new Set([...existingArr, ...newArr])].sort((a, b) => a - b);
                updatedDevices[k] = merged;
            });
            addedPeople = newMember.peopleCount || 0;
        }

        const newPeopleCount = data.peopleCount + addedPeople + (addedPeopleCorrection || 0);

        // ---- Fixed split logic: Track actual amounts, not recalculate ----
        let totalPrice = data.price + (extraPrice || 0);

        // Recalculate full price when people/devices change (e.g., new member added)
        if (newMember) {
            const pricingConfig = await getPricingConfig();
            totalPrice = calculateSessionPrice(
                data.duration,
                newPeopleCount,
                updatedDevices,
                new Date(data.startTime),
                pricingConfig
            );
        }

        // Track actual amounts paid
        const alreadyPaidAmount = data.paidAmount || 0;
        const currentPayment = paidNow || 0;
        const newTotalPaid = alreadyPaidAmount + currentPayment;

        // Calculate split amounts
        let newCashAmount = 0;
        let newOnlineAmount = 0;

        if (paymentMode === 'equal' && currentPayment > 0) {
            const totalPayers = (cashCount || 0) + (onlineCount || 0);
            if (totalPayers > 0) {
                const amountPerPerson = currentPayment / totalPayers;
                newCashAmount = (cashCount || 0) * amountPerPerson;
                newOnlineAmount = (onlineCount || 0) * amountPerPerson;
            }
        } else if (paymentMode === 'custom' && currentPayment > 0) {
            if (cashCount > 0 && onlineCount === 0) {
                newCashAmount = currentPayment;
            } else if (onlineCount > 0 && cashCount === 0) {
                newOnlineAmount = currentPayment;
            }
        }

        // Remaining amount is simply: Total - What's been paid
        const remainingAmount = Math.max(0, totalPrice - newTotalPaid);

        let finalRemainingPeople = 0;
        const currentRemainingPeople = data.remainingPeople ?? data.peopleCount;

        let peopleLeaving = 0;

        if (paymentMode === "equal") {
            peopleLeaving = payingPeopleNow || 0;
        } else if (paymentMode === "custom") {
            peopleLeaving = currentPayment > 0 ? 1 : 0;
        }

        finalRemainingPeople = Math.max(0, currentRemainingPeople - peopleLeaving + addedPeople + (addedPeopleCorrection || 0));

        // If session fully paid → zero remaining people
        if (remainingAmount === 0) {
            finalRemainingPeople = 0;
        }

        // ---- Final update ----
        await ref.update({
            duration: data.duration + (extraTime || 0),
            peopleCount: newPeopleCount,
            price: totalPrice,
            paidAmount: newTotalPaid,
            remainingPeople: finalRemainingPeople,
            remainingAmount,
            devices: updatedDevices,
            snacks: updatedSnacks,
            // Update cash and online split totals
            cash: (data.cash || 0) + newCashAmount,
            online: (data.online || 0) + newOnlineAmount,

            members: newMember
                ? [...(data.members || []), newMember]
                : data.members || [],
            updatedAt: new Date().toISOString()
        });


        global.io.emit('session:updated', {
            sessionId: id
        });

        res.json({ message: "Session updated successfully" });

    } catch (error) {
        console.error("❌ updateSession error:", error);
        res.status(500).json({ message: "Failed to update session" });
    }
};


const completeSession = async (req, res) => {
    try {
        const { id } = req.params;

        await db.collection('sessions').doc(id).update({
            status: 'completed',
            completedAt: new Date().toISOString()
        });


        global.io.emit('session:completed', { sessionId: id });
        res.json({ message: 'Session completed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to complete session' });
    }
};

const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { deletedBy, deletedByName } = req.body; // Expect user info

        const docRef = db.collection('sessions').doc(id);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            // Create Audit Log
            await db.collection('deletion_logs').add({
                source: 'Active Session',
                targetId: id,
                customerName: data.customerName || 'Unknown',
                details: data,
                deletedBy: deletedBy || 'Unknown', // 'owner' or 'employee'
                deletedByName: deletedByName || 'Unknown',
                deletedAt: new Date().toISOString()
            });

            await docRef.delete();
            res.status(200).json({ message: 'Session deleted and logged successfully' });
        } else {
            res.status(404).json({ message: 'Session not found' });
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ message: 'Failed to delete session' });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { deletedBy, deletedByName } = req.body;

        const docRef = db.collection('bookings').doc(id);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            // Create Audit Log
            await db.collection('deletion_logs').add({
                source: 'Upcoming Booking',
                targetId: id,
                customerName: data.customerName || 'Unknown',
                details: data,
                deletedBy: deletedBy || 'Unknown',
                deletedByName: deletedByName || 'Unknown',
                deletedAt: new Date().toISOString()
            });

            await docRef.delete();
            res.status(200).json({ message: 'Booking deleted and logged successfully' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Failed to delete booking' });
    }
};

// Convert bookings to active sessions when their time arrives
const convertBookingsToSessions = async (req, res) => {
    try {
        if (!db) {
            console.error('❌ Database not initialized');
            return res ? res.status(500).json({ message: 'Database not initialized' }) : null;
        }

        const now = new Date();
        console.log(`🔄 Checking for bookings to convert at ${now.toISOString()}`);

        // Get all upcoming bookings
        const snapshot = await db
            .collection('bookings')
            .where('status', '==', 'upcoming')
            .get();

        if (snapshot.empty) {
            console.log('📭 No upcoming bookings found');
            return res ? res.status(200).json({ message: 'No bookings to convert', converted: 0 }) : { converted: 0 };
        }

        const pricingConfig = await getPricingConfig();

        let convertedCount = 0;
        const conversions = [];

        for (const doc of snapshot.docs) {
            const booking = doc.data();
            const bookingTime = booking.bookingTime?.toDate
                ? booking.bookingTime.toDate()
                : new Date(booking.bookingTime);

            // Check if booking time has arrived (within 1 minute tolerance)
            const timeDiff = now - bookingTime;
            const shouldStart = timeDiff >= 0 && timeDiff <= 60000; // Within 1 minute

            if (shouldStart) {
                console.log(`✅ Converting booking ${doc.id} for ${booking.customerName}`);

                // Calculate duration from start and end times
                let duration = 1; // Default 1 hour
                if (booking.bookingEndTime) {
                    const endTime = booking.bookingEndTime?.toDate
                        ? booking.bookingEndTime.toDate()
                        : new Date(booking.bookingEndTime);
                    duration = (endTime - bookingTime) / (1000 * 60 * 60); // Convert to hours
                }

                // Use the people count from the booking (or default to 1)
                const finalPeopleCount = booking.peopleCount || 1;

                // Calculate price using shared logic
                const calculatedPrice = calculateSessionPrice(
                    parseFloat(duration.toFixed(2)),
                    finalPeopleCount,
                    booking.devices || {},
                    now, // Use current time for pricing rules
                    pricingConfig
                );

                // Create new session
                const newSession = {
                    customerName: booking.customerName,
                    contactNumber: booking.contactNumber || '',
                    duration: parseFloat(duration.toFixed(2)),
                    peopleCount: finalPeopleCount,
                    snacks: '',
                    devices: booking.devices || {},
                    price: calculatedPrice,
                    paidAmount: 0,
                    cash: 0,
                    online: 0,
                    remainingPeople: finalPeopleCount,  // Initially all people are remaining
                    remainingAmount: calculatedPrice,
                    status: 'active',
                    startTime: now.toISOString(),
                    createdAt: now.toISOString(),
                    convertedFromBooking: true,
                    originalBookingId: doc.id
                };

                // Add to sessions collection
                const sessionRef = await db.collection('sessions').add(newSession);
                console.log(`✨ Created session ${sessionRef.id} from booking ${doc.id}`);

                // Delete the booking
                await db.collection('bookings').doc(doc.id).delete();
                console.log(`🗑️ Deleted booking ${doc.id}`);

                convertedCount++;
                conversions.push({
                    bookingId: doc.id,
                    sessionId: sessionRef.id,
                    customerName: booking.customerName
                });

                // Emit specific event for this conversion
                global.io.emit('booking:converted', {
                    bookingId: doc.id,
                    sessionId: sessionRef.id
                });

                global.io.emit('session:started', {
                    id: sessionRef.id,
                    ...newSession,
                    devices: transformDevicesToArray(newSession.devices)
                });
            }
        }

        console.log(`✅ Converted ${convertedCount} booking(s) to active sessions`);

        return res
            ? res.status(200).json({
                message: `Converted ${convertedCount} booking(s)`,
                converted: convertedCount,
                conversions
            })
            : { converted: convertedCount, conversions };


    } catch (error) {
        console.error('❌ Error converting bookings:', error);
        return res
            ? res.status(500).json({ message: 'Error converting bookings' })
            : { error: error.message };
    }
};

// Auto-check endpoint (can be called by cron or frontend polling)
const autoConvertBookings = async () => {
    try {
        return await convertBookingsToSessions(null, null);
    } catch (error) {
        console.error('❌ Auto-convert error:', error);
        return { error: error.message };
    }
};

const startBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = db.collection('bookings').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const booking = doc.data();
        const now = new Date();

        // Calculate duration based on original schedule
        let durationInHours = 1;
        if (booking.bookingTime && booking.bookingEndTime) {
            const bStart = booking.bookingTime.toDate ? booking.bookingTime.toDate() : new Date(booking.bookingTime);
            const bEnd = booking.bookingEndTime.toDate ? booking.bookingEndTime.toDate() : new Date(booking.bookingEndTime);
            durationInHours = (bEnd - bStart) / (1000 * 60 * 60);
        } else if (booking.duration) {
            durationInHours = booking.duration;
        }

        const finalPeopleCount = booking.peopleCount || 1;
        const pricingConfig = await getPricingConfig();
        
        // Recalculate price effectively using "now" as the start time, 
        // to adapt to any contextual pricing logic that looks at time-of-day.
        const calculatedPrice = calculateSessionPrice(
            parseFloat(durationInHours.toFixed(2)),
            finalPeopleCount,
            booking.devices || {},
            now,
            pricingConfig
        );

        const newSession = {
            customerName: booking.customerName,
            contactNumber: booking.contactNumber || '',
            duration: parseFloat(durationInHours.toFixed(2)),
            peopleCount: finalPeopleCount,
            snacks: '',
            devices: booking.devices || {},
            price: calculatedPrice,
            paidAmount: 0,
            cash: 0,
            online: 0,
            remainingPeople: finalPeopleCount,
            remainingAmount: calculatedPrice,
            status: 'active',
            startTime: now.toISOString(),
            createdAt: now.toISOString(),
            convertedFromBooking: true,
            originalBookingId: doc.id
        };

        const sessionRef = await db.collection('sessions').add(newSession);
        
        // Remove the booking
        await docRef.delete();

        // Fire signals
        if (global.io) {
            global.io.emit('booking:converted', { bookingId: doc.id, sessionId: sessionRef.id });
            global.io.emit('session:started', {
                id: sessionRef.id,
                ...newSession,
                devices: transformDevicesToArray(newSession.devices)
            });
        }

        return res.status(200).json({ message: 'Booking started successfully', sessionId: sessionRef.id });
    } catch (error) {
        console.error('Error starting booking:', error);
        return res.status(500).json({ message: 'Failed to start booking' });
    }
};

const createSnackOnlySession = async (req, res) => {
    try {
        const { customerName, snacks, totalAmount, paymentMethod } = req.body;

        if (!customerName || !snacks || !Array.isArray(snacks) || snacks.length === 0) {
            return res.status(400).json({ message: 'Customer name and at least one snack are required.' });
        }

        const total = parseFloat(totalAmount) || 0;

        // Deduct stock
        const stockItems = snacks.map(s => ({ name: s.name, quantity: s.qty }));
        await snackService.deductStock(stockItems);

        // Determine cash/online split
        let cash = 0;
        let online = 0;
        if (paymentMethod === 'cash') {
            cash = total;
        } else if (paymentMethod === 'online') {
            online = total;
        } else if (paymentMethod === 'split') {
            // 50/50 split if not otherwise specified
            cash = Math.round(total / 2);
            online = total - cash;
        }

        // Format snack details for storage
        const snackDetails = snacks.map(s => ({ name: s.name, quantity: s.qty }));

        const now = new Date().toISOString();
        const newSession = {
            customerName,
            customerNameLower: customerName.toLowerCase(),
            contactNumber: '',
            duration: 0,
            peopleCount: 1,
            gameName: 'Snacks Only',
            snacks: snackDetails,
            devices: {},
            price: total,
            paidAmount: total,
            cash,
            online,
            remainingPeople: 0,
            remainingAmount: 0,
            status: 'completed',
            startTime: now,
            completedAt: now,
            createdAt: now,
            isSnackOnly: true
        };

        await db.collection('sessions').add(newSession);

        res.status(201).json({ message: 'Inhouse snack order recorded successfully.' });
    } catch (error) {
        console.error('❌ createSnackOnlySession error:', error);
        res.status(500).json({ message: 'Failed to record snack order.' });
    }
};

module.exports = {
    createSession,
    getActiveSessions,
    createBooking,
    getUpcomingBookings,
    exportSessions,
    getDeviceAvailability,
    getDeviceAvailabilityForTime,
    updateSession,
    completeSession,
    deleteSession,
    deleteBooking,
    convertBookingsToSessions,
    autoConvertBookings,
    startBooking,
    createSnackOnlySession
};
