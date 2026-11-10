const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase first
require('./config/firebase');

const rateLimit = require('express-rate-limit');
const verifyFirebaseToken = require('./middleware/auth.middleware');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const snackRoutes = require('./routes/snackRoutes');
const searchCustomer = require('./routes/customerRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: ["http://localhost:5173", "https://sb-max.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// Rate limiters
const limiter = (limit) => rateLimit({ windowMs: 60_000, limit, standardHeaders: true, legacyHeaders: false });
app.use('/api/customers/search', limiter(60));
app.use('/api/analytics', limiter(30));
app.use('/api/owner', limiter(60));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', verifyFirebaseToken, sessionRoutes);
app.use('/api/battles', verifyFirebaseToken, require('./routes/battleRoutes'));
app.use('/api/analytics', verifyFirebaseToken, require('./routes/analyticsRoutes'));
app.use('/api/owner', verifyFirebaseToken, require('./routes/ownerRoute'));
app.use('/api/management', verifyFirebaseToken, require('./routes/managementRoutes'));
app.use('/api/subscription', verifyFirebaseToken, require('./routes/subscriptionRoute'));
app.use('/api/snacks', verifyFirebaseToken, snackRoutes);
app.use('/api/pricing', verifyFirebaseToken, require('./routes/pricingRoutes'));
app.use('/api/customers', verifyFirebaseToken, searchCustomer);
app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => {
  res.status(200).json({ message: 'SB Gaming Cafe API is Online', status: 'active' });
});

module.exports = app;
