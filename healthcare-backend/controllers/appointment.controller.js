const Appointment = require("../models/Appointment");

// FETCH APPOINTMENTS
exports.getAppointments = async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        
        console.log("Fetching appointments for address:", address);
        
        // Find appointments where address is patient OR doctor
        // This allows both patients and doctors to see their appointments
        const list = await Appointment.find({
            $or: [{ patient: address }, { doctor: address }]
        }).sort({ when: -1 });

        console.log(`Found ${list.length} appointments for ${address}`);
        
        return res.json(list);
    } catch (err) {
        console.error("Error fetching appointments:", err);
        return res.status(500).json({ error: err.message });
    }
};

// GET ALL APPOINTMENTS (for hospital to see all)
exports.getAllAppointments = async (req, res) => {
    try {
        console.log("Fetching all appointments");
        
        const list = await Appointment.find().sort({ when: -1 });
        
        console.log(`Found ${list.length} total appointments`);
        
        return res.json(list);
    } catch (err) {
        console.error("Error fetching all appointments:", err);
        return res.status(500).json({ error: err.message });
    }
};