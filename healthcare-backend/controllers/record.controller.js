const MedicalRecord = require("../models/MedicalRecord");
const uploadToIPFS = require("../services/ipfs");

// Upload to IPFS only
exports.uploadRecord = async (req, res) => {
    try {
        const { patient } = req.body;

        if (!req.file)
            return res.status(400).json({ error: "File missing" });

        const ipfsHash = await uploadToIPFS(req.file.path);

        // Frontend will send this ipfsHash to blockchain

        return res.json({
            message: "File uploaded successfully",
            ipfsHash
        });

    } catch (err) {
        console.error("Record upload err:", err);
        return res.status(500).json({ error: err.message });
    }
};

// Fetch DB records (synced via events)
exports.getRecords = async (req, res) => {
    try {
        const patient = req.params.patient.toLowerCase();
        const records = await MedicalRecord.find({ patient }).sort({ timestamp: -1 });
        return res.json(records);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
