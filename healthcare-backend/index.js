// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // your mongo connection file
const listenToEvents = require("./services/eventListener");
const { initializeBlockchain, getContract } = require("./config/web3");

const app = express();
app.use(cors());
app.use(express.json());

// --- routes (ensure these are mounted) ---
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/records", require("./routes/record.routes"));
app.use("/api/prescriptions", require("./routes/prescription.routes"));
app.use("/api/appointments", require("./routes/appointment.routes"));
app.use("/api/claims", require("./routes/claim.routes"));

app.get("/test-events", async (req, res) => {
  try {
    const contract = getContract();
    if (!contract) return res.status(500).json({ ok: false, error: "No contract instance" });

    const owner = await contract.owner();

    return res.json({
      ok: true,
      contractAddress: contract.target || contract.address,
      owner
    });

  } catch (err) {
    console.error("test-events err:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// start server AFTER DB + blockchain init
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await connectDB();                // connect to MongoDB
    await initializeBlockchain();     // init provider + contract inside config/web3
    await listenToEvents();           // attach listeners
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();
