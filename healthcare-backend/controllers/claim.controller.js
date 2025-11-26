const Claim = require("../models/Claim");

exports.getClaims = async (req, res) => {
    const { address } = req.params;

    try {
        console.log("Fetching claims for address:", address);
        
        // Find claims where address is hospital, patient, OR insurer
        const list = await Claim.find({
            $or: [
                { hospital: address.toLowerCase() },
                { patient: address.toLowerCase() },
                { insurer: address.toLowerCase() }  // ⭐ ADDED THIS!
            ]
        }).sort({ claimId: -1 });  // Sort by newest first

        console.log(`Found ${list.length} claims for ${address}`);

        res.json(list);

    } catch (err) {
        console.error("Error fetching claims:", err);
        return res.status(500).json({ error: err.message });
    }
};