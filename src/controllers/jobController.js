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
      auditLogs: [
        {
          action: "JOB_CREATED",
          changedBy: req.user.id,
          role: "ADMIN",
          metadata: {
            jobNumber: req.body.jobNumber,
          },
        },
      ],
    });

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

    // ✅ STEP 4: Audit log for admin approval
    job.auditLogs.push({
      action: "JOB_APPROVED",
      fromStatus: "AWAITING_ADMIN_APPROVAL",
      toStatus: "RECEIVED",
      changedBy: req.user.id,
      role: "ADMIN",
    });

    // Start worker flow
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

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.assignedWorker = workerId;

    job.auditLogs.push({
      action: "WORKER_ASSIGNED",
      changedBy: req.user.id,
      role: "ADMIN",
      metadata: {
        workerId,
      },
    });

    await job.save();
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
    console.error("GET MY JOBS ERROR:", error);
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

    const oldStatus = job.status;

    // Apply updates
    Object.assign(job, req.body);

    // Log status change
    if (req.body.status && req.body.status !== oldStatus) {
      job.auditLogs.push({
        action: "STATUS_CHANGED",
        fromStatus: oldStatus,
        toStatus: req.body.status,
        changedBy: req.user.id,
        role: "WORKER",
      });
    }

    // Log measurement update
    if (req.body.measurements) {
      job.auditLogs.push({
        action: "MEASUREMENT_UPDATED",
        changedBy: req.user.id,
        role: "WORKER",
        metadata: {
          fields: Object.keys(req.body.measurements),
        },
      });
    }

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
      if (
        !job.assignedWorker ||
        job.assignedWorker._id.toString() !== req.user.id
      ) {
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
