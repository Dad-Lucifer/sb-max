const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase first
require('./config/firebase');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');


const app = express();
app.use(cors({
  origin: [, "http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

const snackRoutes = require('./routes/snackRoutes');
const searchCustomer = require('./routes/customerRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/battles', require('./routes/battleRoutes'));
// app.js or server.js
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/owner', require('./routes/ownerRoute'));
app.use('/api/management', require('./routes/managementRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoute'));
app.use('/api/snacks', snackRoutes);
app.use('/api/pricing', require('./routes/pricingRoutes'));

app.use('/api/customers', searchCustomer);
app.use('/api/users', require('./routes/userRoutes'));



app.get('/', (req, res) => {
  res.status(200).json({ message: 'Thunder Gaming Cafe API is Online', status: 'active' });
});
module.exports = app