// backend/services/eventListener.js
const { getContract, getProvider } = require("../config/web3");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Claim = require("../models/Claim");
const User = require("../models/User"); // make sure you have this

let initialized = false;

const safeLower = (addr) =>
  typeof addr === "string" ? addr.toLowerCase() : addr;

const listenToEvents = async () => {
  if (initialized) return;
  initialized = true;

  try {
    const contract = getContract();
    const provider = getProvider();

    console.log("👂 Setting up blockchain event listeners...");
    try {
      const providerInfo =
        provider &&
        (provider.connection?.url || provider._network || provider.network);
      console.log("Provider (debug):", providerInfo || "unknown");
    } catch (e) {
      // ignore
    }

    const contractAddress =
      contract?.target || contract?.address || contract?.options?.address;
    console.log(
      "Listening to contract at:",
      contractAddress || "(no address found)"
    );

    // remove old listeners (safe)
    try {
      contract.removeAllListeners();
    } catch (e) {
      /* ignore */
    }

    // RoleRegistered(address who, Role role)
    contract.on("RoleRegistered", async (who, roleEnum, event) => {
      try {
        const wallet = safeLower(who);
        console.log("🔐 RoleRegistered", { wallet, role: Number(roleEnum) });
        // Optional: sync role in users collection
        await User.updateOne(
          { wallet },
          { $set: { wallet, role: Number(roleEnum) } },
          { upsert: true }
        );
      } catch (err) {
        console.error("ERR handling RoleRegistered:", err);
      }
    });

    contract.on("DoctorAddedToHospital", async (hospital, doctor, event) => {
      console.log("🏥 DoctorAddedToHospital", { hospital, doctor });

      await User.updateOne(
        { wallet: doctor.toLowerCase() },
        {
          $set: {
            assignedHospital: hospital.toLowerCase(),
            hospitalAssignedAt: Date.now(),
            hospitalAssignTx: event?.transactionHash,
          },
        },
        { upsert: true }
      );
    });

    // AccessChanged(patient, grantee, allowed)
    contract.on("AccessChanged", async (patient, grantee, allowed, event) => {
      try {
        console.log("🔁 AccessChanged", {
          patient: safeLower(patient),
          grantee: safeLower(grantee),
          allowed: Boolean(allowed),
          txHash: event?.transactionHash,
        });

        // No database storage — access is always read from blockchain
        // (So no User.updateOne necessary)
      } catch (err) {
        console.error("ERR handling AccessChanged:", err);
      }
    });

    // DoctorAssigned(patient, doctor, hospital)
    contract.on("DoctorAssigned", async (patient, doctor, hospital, event) => {
      try {
        const p = safeLower(patient);
        const d = safeLower(doctor);
        const h = safeLower(hospital);
        console.log("🩺 DoctorAssigned", {
          patient: p,
          doctor: d,
          hospital: h,
        });
        // Save assignment in user document (or separate model)
        await User.updateOne(
          { wallet: p },
          {
            $set: {
              assignedDoctor: d,
              hospital: h,
              assignedAt: Date.now(),
              assignedTx: event?.transactionHash,
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error("ERR handling DoctorAssigned:", err);
      }
    });

    // MedicalRecordAdded(patient, uploader, ipfsHash, timestamp)
    contract.on(
      "MedicalRecordAdded",
      async (patient, uploader, ipfsHash, timestamp, event) => {
        try {
          console.log("📄 MedicalRecordAdded", {
            patient: safeLower(patient),
            uploader: safeLower(uploader),
            ipfsHash,
            timestamp: Number(timestamp),
          });
          await MedicalRecord.create({
            patient: safeLower(patient),
            uploader: safeLower(uploader),
            ipfsHash,
            timestamp: Number(timestamp),
            recordType: "medical",
            txHash: event?.transactionHash,
          });
        } catch (err) {
          console.error("ERR saving MedicalRecordAdded:", err);
        }
      }
    );

    // PrescriptionAdded(patient, doctor, ipfsHash, timestamp)
    contract.on(
      "PrescriptionAdded",
      async (patient, doctor, ipfsHash, timestamp, event) => {
        try {
          const pAddr = safeLower(patient);
          console.log("💊 PrescriptionAdded", {
            patient: pAddr,
            doctor: safeLower(doctor),
            ipfsHash,
            timestamp: Number(timestamp),
          });
          const count = await Prescription.countDocuments({ patient: pAddr });
          await Prescription.create({
            patient: pAddr,
            doctor: safeLower(doctor),
            ipfsHash,
            timestamp: Number(timestamp),
            prescriptionIndex: count,
            filled: false,
            txHash: event?.transactionHash,
          });
        } catch (err) {
          console.error("ERR saving PrescriptionAdded:", err);
        }
      }
    );

    // PrescriptionFilled(patient, index, pharmacy)
    contract.on(
      "PrescriptionFilled",
      async (patient, index, pharmacy, event) => {
        try {
          const pAddr = safeLower(patient);
          const idx = Number(index);
          console.log("🏥 PrescriptionFilled", {
            patient: pAddr,
            index: idx,
            pharmacy: safeLower(pharmacy),
          });
          const pDoc = await Prescription.findOne({
            patient: pAddr,
            prescriptionIndex: idx,
          });
          if (pDoc) {
            pDoc.filled = true;
            pDoc.filledBy = safeLower(pharmacy);
            pDoc.filledAt = Date.now();
            pDoc.filledTx = event?.transactionHash;
            await pDoc.save();
          } else {
            console.warn("Prescription not found to mark filled", pAddr, idx);
          }
        } catch (err) {
          console.error("ERR handling PrescriptionFilled:", err);
        }
      }
    );

    // AppointmentCreated(appointmentId, patient, doctor, when)
    contract.on(
      "AppointmentCreated",
      async (appointmentId, patient, doctor, when, event) => {
        try {
          const id = Number(appointmentId);
          console.log("📅 AppointmentCreated", {
            id,
            patient: safeLower(patient),
            doctor: safeLower(doctor),
            when: Number(when),
          });
          await Appointment.create({
            appointmentId: id,
            patient: safeLower(patient),
            doctor: safeLower(doctor),
            when: Number(when),
            approved: false,
            cancelled: false,
            txHash: event?.transactionHash,
          });
        } catch (err) {
          console.error("ERR saving AppointmentCreated:", err);
        }
      }
    );

    // AppointmentApproved(appointmentId, doctor)
    contract.on("AppointmentApproved", async (appointmentId, doctor, event) => {
      try {
        const id = Number(appointmentId);
        console.log("✔ AppointmentApproved", {
          appointmentId: id,
          doctor: safeLower(doctor),
        });
        const appt = await Appointment.findOne({ appointmentId: id });
        if (appt) {
          appt.approved = true;
          appt.approvedAt = Date.now();
          appt.approvedBy = safeLower(doctor);
          appt.approvedTx = event?.transactionHash;
          await appt.save();
        } else {
          console.warn("Appointment not found for approval:", id);
        }
      } catch (err) {
        console.error("ERR handling AppointmentApproved:", err);
      }
    });

    // AppointmentCancelled(appointmentId, cancelledBy)
    contract.on(
      "AppointmentCancelled",
      async (appointmentId, cancelledBy, event) => {
        try {
          const id = Number(appointmentId);
          console.log("❌ AppointmentCancelled", {
            appointmentId: id,
            cancelledBy: safeLower(cancelledBy),
          });
          const appt = await Appointment.findOne({ appointmentId: id });
          if (appt) {
            appt.cancelled = true;
            appt.cancelledAt = Date.now();
            appt.cancelledBy = safeLower(cancelledBy);
            appt.cancelledTx = event?.transactionHash;
            await appt.save();
          } else {
            console.warn("Appointment not found for cancellation:", id);
          }
        } catch (err) {
          console.error("ERR handling AppointmentCancelled:", err);
        }
      }
    );

    // ClaimCreated(claimId, hospital, patient, amount)
    contract.on(
      "ClaimCreated",
      async (claimId, hospital, patient, amount, event) => {
        try {
          const id = Number(claimId);
          console.log("🧾 ClaimCreated", {
            claimId: id,
            hospital: safeLower(hospital),
            patient: safeLower(patient),
            amount: amount.toString(),
          });

          // ⭐ IMPORTANT: Read full claim from contract to get insurer
          // The event doesn't include insurer, so we need to read from contract storage
          const claimData = await contract.claims(id);

          await Claim.create({
            claimId: id,
            hospital: safeLower(hospital),
            patient: safeLower(patient),
            insurer: safeLower(claimData.insurer), // ⭐ Get from contract
            amount: amount.toString(),
            paid: false,
            rejected: false,
            txHash: event?.transactionHash,
          });

          console.log(
            `✅ Claim ${id} saved to database with insurer: ${claimData.insurer}`
          );
        } catch (err) {
          console.error("ERR saving ClaimCreated:", err);
        }
      }
    );

    // ClaimApproved(claimId, insurer, hospital, amount)
    contract.on(
      "ClaimApproved",
      async (claimId, insurer, hospital, amount, event) => {
        try {
          const id = Number(claimId);
          console.log("💰 ClaimApproved", {
            claimId: id,
            insurer: safeLower(insurer),
            hospital: safeLower(hospital),
            amount: amount.toString(),
          });
          const c = await Claim.findOne({ claimId: id });
          if (c) {
            c.paid = true;
            c.paidAt = Date.now();
            c.paidBy = safeLower(insurer);
            c.paidAmount = amount.toString();
            c.paidTx = event?.transactionHash;
            await c.save();
          } else {
            console.warn("Claim not found for approve:", id);
          }
        } catch (err) {
          console.error("ERR handling ClaimApproved:", err);
        }
      }
    );

    contract.on("ClaimRejected", async (claimId, insurer, hospital, event) => {
      try {
        const id = Number(claimId);
        console.log("❗ ClaimRejected", {
          claimId: id,
          insurer: safeLower(insurer),
          hospital: safeLower(hospital),
        });

        const c = await Claim.findOne({ claimId: id });

        if (c) {
          c.rejected = true;
          c.rejectedBy = safeLower(insurer);
          c.rejectedAt = Date.now();
          c.rejectedTx = event?.transactionHash;
          await c.save();
        } else {
          console.warn("Claim not found for rejection:", id);
        }
      } catch (err) {
        console.error("ERR handling ClaimRejected:", err);
      }
    });

    // InsuranceDeposited(insurer, amount)
    contract.on("InsuranceDeposited", async (insurer, amount, event) => {
      try {
        console.log("🏦 InsuranceDeposited", {
          insurer: safeLower(insurer),
          amount: amount.toString(),
        });
        // Optionally update user or insurer model
        await User.updateOne(
          { wallet: safeLower(insurer) },
          { $set: { lastInsuranceDeposit: Date.now() } },
          { upsert: true }
        );
      } catch (err) {
        console.error("ERR handling InsuranceDeposited:", err);
      }
    });

    console.log("✅ Event listeners active.");
  } catch (err) {
    console.error("Failed to initialize event listeners:", err);
    initialized = false;
  }
};

module.exports = listenToEvents;
