const express = require("express");
const router = express.Router();
const { getClaims } = require("../controllers/claim.controller");

router.get("/:address", getClaims);

module.exports = router;
