const express = require("express");
const multer = require("multer");
const router = express.Router();
const { uploadRecord, getRecords } = require("../controllers/record.controller");

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), uploadRecord);
router.get("/:patient", getRecords);

module.exports = router;
