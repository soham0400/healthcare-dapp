const express = require("express");
const multer = require("multer");
const router = express.Router();
const { addPrescription, getPrescriptions } = require("../controllers/prescription.controller");

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), addPrescription);
router.get("/:patient", getPrescriptions);

module.exports = router;
