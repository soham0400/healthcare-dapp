const User = require("../models/User");

// Register a user (patient/doctor/hospital/etc.)
exports.registerUser = async (req, res) => {
    try {
        const { wallet, role, name, email, phone } = req.body;

        if (!wallet || !role) {
            return res.status(400).json({ message: "wallet & role are required" });
        }

        let existing = await User.findOne({ wallet });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create(req.body);

        return res.json({
            message: "User registered successfully",
            user
        });

    } catch (err) {
        console.error("registerUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get user by wallet address
exports.getUser = async (req, res) => {
    try {
        const wallet = req.params.wallet.toLowerCase();

        const user = await User.findOne({ wallet });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(user);

    } catch (err) {
        console.error("getUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Update user profile
exports.updateUser = async (req, res) => {
    try {
        const wallet = req.params.wallet.toLowerCase();

        const updated = await User.findOneAndUpdate(
            { wallet },
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            message: "Profile updated",
            user: updated
        });

    } catch (err) {
        console.error("updateUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// List users by role (doctors/patients/hospitals etc.)
exports.getUsersByRole = async (req, res) => {
    try {
        const role = req.params.role;

        const users = await User.find({ role });

        return res.json(users);

    } catch (err) {
        console.error("getUsersByRole error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
