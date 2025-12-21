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

    // MEASUREMENTS (ALL IN MM / KG WHERE APPLICABLE)
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

    // PROCESS FLAGS & APPROVALS
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

    // STATUS TRACKING
    status: {
      type: String,
      enum: [
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

    // WORKER ASSIGNMENT
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🔒 ADMIN-ONLY FIELDS
    companyName: {
      type: String,
    },
    price: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
