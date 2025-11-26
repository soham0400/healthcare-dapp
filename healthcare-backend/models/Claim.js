const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
    claimId: Number,
    hospital: String,
    patient: String,
    insurer: String,  // ⭐ ADDED THIS!
    amount: String,
    paid: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
    paidAt: Number,
    paidBy: String,
    paidAmount: String,
    paidTx: String,
    rejectedAt: Number,
    rejectedBy: String,
    rejectedTx: String,
    txHash: String,
    timestamp: { type: Number, default: () => Math.floor(Date.now() / 1000) }
});

module.exports = mongoose.model("Claim", ClaimSchema);