const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
    appointmentId: Number,
    patient: String,
    doctor: String,
    when: Number,
    approved: Boolean,
    cancelled: Boolean,
    cancelledBy: String,
    cancelledAt: Number,
    approvedAt: Number,
    approvedBy: String,
    txHash: String,
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
