const Prescription = require("../models/Prescription");
const uploadToIPFS = require("../services/ipfs");

// Upload file only
exports.addPrescription = async (req, res) => {
    try {
        const { patient } = req.body;

        if (!req.file)
            return res.status(400).json({ error: "File missing" });

        const ipfsHash = await uploadToIPFS(req.file.path);

        // Blockchain write happens from frontend

        return res.json({
            message: "Prescription file uploaded",
            ipfsHash
        });

    } catch (err) {
        console.error("Prescription err:", err);
        return res.status(500).json({ error: err.message });
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const patient = req.params.patient.toLowerCase();
        const list = await Prescription.find({ patient }).sort({ timestamp: -1 });
        return res.json(list);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
