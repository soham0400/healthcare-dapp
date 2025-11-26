const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema({
    patient: String,
    doctor: String,
    ipfsHash: String,
    timestamp: Number,
    prescriptionIndex: Number,
    filled: { type: Boolean, default: false },
    filledBy: String,
    filledAt: Number,
    filledTx: String,
    txHash: String
});

module.exports = mongoose.model("Prescription", PrescriptionSchema);
