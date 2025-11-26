const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    wallet: { type: String, required: true, unique: true, index: true },
    role: { 
        type: String, 
        enum: ["patient", "doctor", "hospital", "pharmacy", "insurance"], 
        required: true 
    },

    // Common fields
    name: { type: String },
    email: { type: String },
    phone: { type: String },

    // Patient-specific
    age: Number,
    gender: String,

    // Doctor-specific
    specialization: String,
    experience: Number,
    registrationNumber: String,

    // Hospital-specific
    hospitalName: String,
    hospitalAddress: String,

    // Pharmacy-specific
    licenseNumber: String,

    // Insurance-specific
    companyName: String,
    policyInfo: String,

    profilePicCID: String
}, {
    timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
