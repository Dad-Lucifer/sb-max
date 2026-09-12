const express = require("express");
const router = express.Router();

const { searchCustomers } = require("../controllers/customerSearchController");

router.get("/search", searchCustomers);

module.exports = router;
