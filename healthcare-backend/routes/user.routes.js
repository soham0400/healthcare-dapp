const express = require("express");
const router = express.Router();

const {
    registerUser,
    getUser,
    updateUser,
    getUsersByRole
} = require("../controllers/user.controller");

// Register new user
router.post("/register", registerUser);

// Get all users of a given role
router.get("/role/:role", getUsersByRole);

// Get user by wallet
router.get("/:wallet", getUser);

// Update user profile
router.put("/:wallet", updateUser);

module.exports = router;
