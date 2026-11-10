const { db } = require('../config/firebase');
const { getSubscriptionDocs, afterSubscriptionWrite } = require('../services/dataCache');

/**
 * ➕ Create subscription - Optimized with validation
 */
const createSubscription = async (req, res) => {
  try {
    const { name, startDate, endDate, price, cycle, category } = req.body;

    // Enhanced validation
    if (!name || !startDate || !endDate || !price) {
      return res.status(400).json({
        message: 'Name, start date, end date, and price are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate price is a positive number
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        message: 'Price must be a positive number',
        error: 'INVALID_PRICE'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format',
        error: 'INVALID_DATE'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        message: 'End date must be after start date',
        error: 'INVALID_DATE_RANGE'
      });
    }

    // Validate cycle
    const validCycles = ['monthly', 'yearly'];
    const validatedCycle = cycle && validCycles.includes(cycle) ? cycle : 'monthly';

    const subscription = {
      name: name.trim(),
      startDate,
      endDate,
      price: parsedPrice,
      cycle: validatedCycle,
      category: category || 'general',
      createdAt: new Date().toISOString()
    };

    const ref = await db.collection('subscriptions').add(subscription);
    afterSubscriptionWrite();

    res.status(201).json({
      id: ref.id,
      ...subscription
    });

  } catch (err) {
    console.error('❌ createSubscription error:', err);
    res.status(500).json({
      message: 'Failed to create subscription',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * 📥 Get all subscriptions - Optimized with caching headers
 */
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await getSubscriptionDocs();
    res.set('Cache-Control', 'private, max-age=60');
    res.json(subscriptions);
  } catch (err) {
    console.error('❌ getSubscriptions error:', err);
    res.status(500).json({
      message: 'Failed to fetch subscriptions',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * 🗑️ Delete subscription - Optimized with validation
 */
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        message: 'Subscription ID is required',
        error: 'INVALID_ID'
      });
    }

    await db.collection('subscriptions').doc(id).delete();
    afterSubscriptionWrite();

    res.status(200).json({
      message: 'Subscription deleted successfully',
      id
    });

  } catch (err) {
    console.error('❌ deleteSubscription error:', err);
    res.status(500).json({
      message: 'Failed to delete subscription',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  createSubscription,
  getSubscriptions,
  deleteSubscription
};