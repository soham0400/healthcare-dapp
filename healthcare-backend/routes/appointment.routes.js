const express = require("express");
const router = express.Router();
const { getAppointments, getAllAppointments } = require("../controllers/appointment.controller");

// Get all appointments (for hospital)
router.get("/all", getAllAppointments);

// Get appointments by address (for patients and doctors)
router.get("/:address", getAppointments);

module.exports = router;