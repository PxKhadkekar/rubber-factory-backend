const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    // BASIC IDENTIFIERS
    jobNumber: {
      type: String,
      required: true,
      unique: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
    },

    rubberType: {
      type: String,
      required: true,
    },

    punchNumber: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },

    processType: {
      type: String,
      enum: ["COATING", "GRINDING"],
      required: true,
    },

    // MEASUREMENTS
    measurements: {
      jobLength: Number,
      jobOldOd: Number,
      jobMsOd: Number,
      requiredOd: Number,
      finishOd: Number,
      eboniteOd: Number,
      roughOd: Number,
      msWeight: Number,
    },

    // ✅ ADMIN APPROVAL FLAGS (THIS IS PHASE 3)
    approvals: {
      coatingApproved: {
        type: Boolean,
        default: false,
      },
      msBondingApproved: {
        type: Boolean,
        default: false,
      },
      inspectionPassed: {
        type: Boolean,
        default: false,
      },
    },

    // ✅ STATUS FLOW (NO WAITING STATUSES HERE)
    status: {
      type: String,
      enum: [
        "AWAITING_ADMIN_APPROVAL",
        "RECEIVED",
        "GRINDING",
        "SANDBLASTING",
        "COATING",
        "BONDING",
        "FINISHING",
        "INSPECTION",
        "DISPATCHED",
      ],
      default: "RECEIVED",
    },

    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ADMIN-ONLY DATA
    companyName: String,
    price: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
