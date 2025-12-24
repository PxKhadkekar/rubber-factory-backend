const Job = require("../models/Job");
const User = require("../models/User");
const JOB_STATUS_FLOW = require("../constants/jobStatusFlow");
const MEASUREMENT_RULES = require("../constants/measurementRules");
const ADMIN_APPROVAL_STAGE = require("../constants/adminApprovalStage");

/**
 * ADMIN: Create job
 */
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ message: "Job created", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Get all jobs
 */
exports.getAllJobsAdmin = async (req, res) => {
  const jobs = await Job.find().populate("assignedWorker", "name email");
  res.json(jobs);
};

/**
 * WORKER: Get my jobs
 */
exports.getMyJobsWorker = async (req, res) => {
  const jobs = await Job.find({
    assignedWorker: req.user.id,
  }).select("-companyName -price");

  res.json(jobs);
};

/**
 * WORKER: Update job
 */
exports.updateJobByWorker = async (req, res) => {
  const { id } = req.params;
  const { status, measurements } = req.body;

  const job = await Job.findById(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (!job.assignedWorker || job.assignedWorker.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not your job" });
  }

  if (job.waitingForApproval) {
    return res.status(403).json({
      message: "Waiting for admin approval",
    });
  }

  if (job.status === "INSPECTION" || job.status === "DISPATCHED") {
    return res.status(403).json({
      message: "Job locked",
    });
  }

  // STATUS UPDATE
  if (status) {
    const currentIndex = JOB_STATUS_FLOW.indexOf(job.status);
    const nextIndex = JOB_STATUS_FLOW.indexOf(status);

    if (nextIndex !== currentIndex + 1) {
      return res.status(403).json({
        message: "Invalid workflow transition",
      });
    }

    // 🔐 ADMIN APPROVAL GATE
    if (ADMIN_APPROVAL_STAGE[status]) {
      job.status = ADMIN_APPROVAL_STAGE[status];
      job.waitingForApproval = true;
    } else {
      job.status = status;
    }
  }

  // MEASUREMENTS
  if (measurements) {
    const allowed = MEASUREMENT_RULES[job.status] || [];
    const invalid = Object.keys(measurements).filter(
      (k) => !allowed.includes(k)
    );

    if (invalid.length > 0) {
      return res.status(403).json({
        message: `Measurements not allowed in ${job.status}`,
        invalid,
      });
    }

    job.measurements = { ...job.measurements, ...measurements };
  }

  await job.save();
  res.json({ message: "Job updated", job });
};

/**
 * ADMIN: Approve job
 */
exports.approveJobStage = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (!job.waitingForApproval) {
    return res.status(400).json({
      message: "Job is not awaiting approval",
    });
  }

  const currentIndex = JOB_STATUS_FLOW.indexOf(job.status);
  job.status = JOB_STATUS_FLOW[currentIndex + 1];
  job.waitingForApproval = false;
  job.lastApprovedBy = req.user.id;

  await job.save();
  res.json({ message: "Job approved", job });
};

/**
 * ADMIN: Assign worker
 */
exports.assignWorkerToJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  const worker = await User.findById(req.body.workerId);

  if (!job || !worker || worker.role !== "WORKER") {
    return res.status(400).json({ message: "Invalid assignment" });
  }

  job.assignedWorker = worker._id;
  await job.save();

  res.json({ message: "Worker assigned", job });
};
