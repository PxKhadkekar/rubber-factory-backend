const Job = require("../models/Job");
const User = require("../models/User");
const JOB_STATUS_FLOW = require("../constants/jobStatusFlow");
const MEASUREMENT_RULES = require("../constants/measurementRules");

/* ---------------- ADMIN: CREATE JOB ---------------- */
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ message: "Job created", job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ---------------- ADMIN: GET ALL JOBS ---------------- */
exports.getAllJobsAdmin = async (req, res) => {
  const jobs = await Job.find().populate("assignedWorker", "name email");
  res.json(jobs);
};

/* ---------------- WORKER: GET MY JOBS ---------------- */
exports.getMyJobsWorker = async (req, res) => {
  const jobs = await Job.find({ assignedWorker: req.user.id }).select(
    "-companyName -price"
  );
  res.json(jobs);
};

/* ---------------- WORKER: UPDATE JOB ---------------- */
exports.updateJobByWorker = async (req, res) => {
  const { status, measurements } = req.body;
  const job = await Job.findById(req.params.id);

  if (!job) return res.status(404).json({ message: "Job not found" });

  if (job.assignedWorker?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // 🔒 HARD LOCK
  if (["INSPECTION", "DISPATCHED"].includes(job.status)) {
    return res.status(403).json({ message: "Job is locked" });
  }

  /* -------- STATUS UPDATE -------- */
  if (status) {
    const currentIndex = JOB_STATUS_FLOW.indexOf(job.status);
    const nextIndex = JOB_STATUS_FLOW.indexOf(status);

    if (nextIndex !== currentIndex + 1) {
      return res
        .status(403)
        .json({ message: "Workflow order violation" });
    }

    // 🚫 ADMIN APPROVAL GATES
    if (
      job.status === "SANDBLASTING" &&
      !job.approvals.coatingApproved
    ) {
      return res
        .status(403)
        .json({ message: "Waiting for admin approval" });
    }

    if (
      job.status === "BONDING" &&
      !job.approvals.msBondingApproved
    ) {
      return res
        .status(403)
        .json({ message: "Waiting for admin approval" });
    }

    job.status = status;
  }

  /* -------- MEASUREMENTS -------- */
  if (measurements) {
    const allowed = MEASUREMENT_RULES[job.status] || [];
    const invalid = Object.keys(measurements).filter(
      (m) => !allowed.includes(m)
    );

    if (invalid.length) {
      return res
        .status(403)
        .json({ message: "Measurement locked for this phase" });
    }

    job.measurements = { ...job.measurements, ...measurements };
  }

  await job.save();
  res.json({ message: "Job updated", job });
};

/* ---------------- ADMIN: APPROVE NEXT STAGE ---------------- */
exports.approveJobStage = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (job.status === "SANDBLASTING") {
    job.approvals.coatingApproved = true;
    job.status = "COATING";
  } else if (job.status === "BONDING") {
    job.approvals.msBondingApproved = true;
    job.status = "FINISHING";
  } else if (job.status === "INSPECTION") {
    job.approvals.inspectionPassed = true;
    job.status = "DISPATCHED";
  } else {
    return res.status(400).json({ message: "No approval required" });
  }

  await job.save();
  res.json({ message: "Job approved", job });
};

/* ---------------- ADMIN: ASSIGN WORKER ---------------- */
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
