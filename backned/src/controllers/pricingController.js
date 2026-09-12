const { db } = require('../config/firebase');

const getDefaultPricingConfig = () => {
    return {
        // Time ranges
        happyHour: {
            monWedStartHour: 9, monWedStartMinute: 0, monWedEndHour: 13, monWedEndMinute: 45,
            thursdayStartHour: 9, thursdayStartMinute: 0, thursdayEndHour: 11, thursdayEndMinute: 45,
            friSunStartHour: 9, friSunStartMinute: 0, friSunEndHour: 11, friSunEndMinute: 45
        },
        normalHour: {
            monWedStartHour: 13, monWedStartMinute: 45, monWedEndHour: 20, monWedEndMinute: 45,
            thursdayStartHour: 11, thursdayStartMinute: 45, thursdayEndHour: 20, thursdayEndMinute: 45,
            friSunStartHour: 11, friSunStartMinute: 45, friSunEndHour: 20, friSunEndMinute: 45
        },
        funNight: { startHour: 20, startMinute: 45, endHour: 6, endMinute: 0 },

        monWedPrices: {
            happyHour: {
                ps5: { less30m: 40, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
            },
            normalHour: {
                ps5: { less30m: 60, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
            },
            funNight: {
                ps5: { less30m: 50, onePerson: 100, twoPerson: 150, multiplePersonBaseMod: 50, extra30mMod: 50 }
            }
        },
        thursdayPrices: {
            happyHour: {
                ps5: { less30m: 40, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
            },
            normalHour: {
                ps5: { less30m: 60, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
            },
            funNight: {
                ps5: { less30m: 50, onePerson: 100, twoPerson: 150, multiplePersonBaseMod: 50, extra30mMod: 50 }
            }
        },
        friSunPrices: {
            happyHour: {
                ps5: { less30m: 40, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
            },
            normalHour: {
                ps5: { less30m: 60, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
            },
            funNight: {
                ps5: { less30m: 50, onePerson: 100, twoPerson: 150, multiplePersonBaseMod: 50, extra30mMod: 50 }
            }
        },
        // Fallback
        fallback: { hourRate: 50 }
    };
};

const getPricing = async (req, res) => {
    try {
        const docRef = db.collection('settings').doc('pricing');
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(200).json(getDefaultPricingConfig());
        }
        res.status(200).json(doc.data());
    } catch (error) {
        console.error('Error fetching pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updatePricing = async (req, res) => {
    try {
        const newConfig = req.body;
        const docRef = db.collection('settings').doc('pricing');
        await docRef.set(newConfig);
        res.status(200).json({ message: 'Pricing updated successfully', data: newConfig });
    } catch (error) {
        console.error('Error updating pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getPricing, updatePricing, getDefaultPricingConfig };
