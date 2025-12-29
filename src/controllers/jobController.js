const Job = require("../models/Job");

/*
|--------------------------------------------------------------------------
| ADMIN CONTROLLERS
|--------------------------------------------------------------------------
*/

// Create new job (ADMIN)
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      status: "AWAITING_ADMIN_APPROVAL",
      createdBy: req.user.id,
    });

    console.log("JOB CREATED:", job.jobNumber);

    return res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("JOB CREATION ERROR:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all jobs (ADMIN)
exports.getAllJobsAdmin = async (req, res) => {
  try {
    const jobs = await Job.find().populate("assignedWorker", "name email");
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Approve job (ADMIN) — OPTION A
exports.approveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "AWAITING_ADMIN_APPROVAL") {
      return res.status(400).json({
        message: "Job is not awaiting admin approval",
      });
    }

    // ✅ OPTION A: Start worker flow
    job.status = "RECEIVED";
    await job.save();

    return res.status(200).json({
      message: "Job approved",
      job,
    });
  } catch (error) {
    console.error("APPROVE JOB ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Assign worker to job (ADMIN)
exports.assignWorkerToJob = async (req, res) => {
  try {
    const { workerId } = req.body;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { assignedWorker: workerId },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/*
|--------------------------------------------------------------------------
| WORKER CONTROLLERS
|--------------------------------------------------------------------------
*/

// Get jobs for logged-in worker
exports.getMyJobsWorker = async (req, res) => {
  try {
    const jobs = await Job.find({ assignedWorker: req.user.id });
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Update job by worker
exports.updateJobByWorker = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      assignedWorker: req.user.id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // ✅ NO admin approval checks here (Option A)
    Object.assign(job, req.body);
    await job.save();

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Get single job by ID (ADMIN + WORKER)
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "assignedWorker",
      "name email"
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 🔐 Worker can only see assigned job
    if (req.user.role === "WORKER") {
      if (!job.assignedWorker || job.assignedWorker._id.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // 🔓 Admin can see any job
    return res.json(job);
  } catch (error) {
    console.error("GET JOB BY ID ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

