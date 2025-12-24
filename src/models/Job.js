const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
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

    status: {
      type: String,
      enum: [
        "RECEIVED",
        "GRINDING",
        "SANDBLASTING",
        "AWAITING_ADMIN_APPROVAL_FOR_COATING",
        "COATING",
        "BONDING",
        "AWAITING_ADMIN_APPROVAL_FOR_RUBBER",
        "FINISHING",
        "INSPECTION",
        "DISPATCHED",
      ],
      default: "RECEIVED",
    },

    waitingForApproval: {
      type: Boolean,
      default: false,
    },

    lastApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    companyName: String,
    price: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
