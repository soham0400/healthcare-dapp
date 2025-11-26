const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema({
    patient: { type: String, required: true },
    uploader: { type: String, required: true },
    ipfsHash: { type: String, required: true },
    timestamp: { type: Number, required: true },
    recordType: { type: String, default: "medical" },
    txHash: String,
});

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
