const express = require('express');
const router = express.Router();
const {
    getSubscriptions,
    createSubscription,
    deleteSubscription,
    getSalaries,
    createSalary,
    deleteSalary
} = require('../controllers/managementController');

/* Subscriptions */
router.get('/subscriptions', getSubscriptions);
router.post('/subscriptions', createSubscription);
router.delete('/subscriptions/:id', deleteSubscription);

/* Salaries */
router.get('/salaries', getSalaries);
router.post('/salaries', createSalary);
router.delete('/salaries/:id', deleteSalary);

module.exports = router;
