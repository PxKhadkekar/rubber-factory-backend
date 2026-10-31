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

    const io = req.app.get("io");
    if (io) io.emit("jobCreated", job);

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
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { jobNumber: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } }
      ];
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const jobs = await Job.find(query)
      .populate("assignedWorker", "name email")
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(query);

    return res.json({
      jobs,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
    });
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

    const io = req.app.get("io");
    if (io) io.emit("jobApproved", job);

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

    const io = req.app.get("io");
    if (io) io.emit("jobAssigned", { job, workerId });

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
    const { page = 1, limit = 10, status, search } = req.query;
    const query = { assignedWorker: req.user.id };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { jobNumber: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } }
      ];
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const jobs = await Job.find(query)
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(query);

    return res.json({
      jobs,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
    });
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

    const io = req.app.get("io");
    if (io) io.emit("jobUpdated", job);

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

/*
|--------------------------------------------------------------------------
| ANALYTICS (ADMIN)
|--------------------------------------------------------------------------
*/

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Jobs Per Day (last 30 days ideally, but we'll do all for simplicity)
    const jobsPerDay = await Job.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // 2. Stage Bottlenecks
    // We count active jobs per status
    const stageBottlenecks = await Job.aggregate([
      {
        $match: { status: { $ne: "DISPATCHED" } }, // Ignore completed
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $project: { stage: "$_id", count: 1, _id: 0 } },
    ]);

    // 3. Worker Efficiency
    const workerEfficiency = await Job.aggregate([
      {
        $match: { assignedWorker: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: "$assignedWorker",
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "DISPATCHED"] }, 1, 0] }
          },
          active: {
            $sum: { $cond: [{ $ne: ["$status", "DISPATCHED"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "users", // the collection name for User model
          localField: "_id",
          foreignField: "_id",
          as: "workerData"
        }
      },
      {
        $unwind: "$workerData"
      },
      {
        $project: {
          workerName: "$workerData.name",
          completed: 1,
          active: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      jobsPerDay,
      stageBottlenecks,
      workerEfficiency,
    });
  } catch (error) {
    console.error("ANALYTICS ERROR:", error);
    res.status(500).json({ message: "Server error calculating analytics" });
  }
};
