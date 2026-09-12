const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Battles route working" });
});

router.get("/thunder-player", (req, res) => {
    const { name, phone } = req.query;
    res.json({ name, phone });
});
module.exports = router;
