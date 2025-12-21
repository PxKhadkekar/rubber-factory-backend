const Job = require("../models/Job");
const User = require("../models/User");

// ADMIN: Create new job
exports.createJob = async (req, res) => {
  try {
    const {
      jobNumber,
      vehicleNumber,
      rubberType,
      punchNumber,
      processType,
      measurements,
      companyName,
      price,
    } = req.body;

    // Basic validation
    if (
      !jobNumber ||
      !vehicleNumber ||
      !rubberType ||
      !punchNumber ||
      !processType
    ) {
      return res
        .status(400)
        .json({ message: "Required job fields missing" });
    }

    const existingJob = await Job.findOne({ jobNumber });
    if (existingJob) {
      return res
        .status(400)
        .json({ message: "Job with this number already exists" });
    }

    const job = await Job.create({
      jobNumber,
      vehicleNumber,
      rubberType,
      punchNumber,
      processType,
      measurements,
      companyName,
      price,
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllJobsAdmin = async (req, res) => {
    try {
      const jobs = await Job.find().populate(
        "assignedWorker",
        "name email role"
      );
  
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

  exports.getMyJobsWorker = async (req, res) => {
    try {
      const jobs = await Job.find({
        assignedWorker: req.user.id,
      }).select(
        "-companyName -price -approvals"
      );
  
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // WORKER: Update job progress (restricted)
exports.updateJobByWorker = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, measurements } = req.body;
  
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
  
      // Ensure job is assigned to this worker
      if (!job.assignedWorker || job.assignedWorker.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized for this job" });
      }
  
      // Allowed status transitions for workers
      const allowedStatuses = [
        "GRINDING",
        "SANDBLASTING",
        "COATING",
        "BONDING",
        "FINISHING",
        "INSPECTION",
      ];
  
      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status update" });
      }
  
      if (status) job.status = status;
  
      // Workers can update measurements only
      if (measurements) {
        job.measurements = {
          ...job.measurements,
          ...measurements,
        };
      }
  
      await job.save();
  
      res.status(200).json({
        message: "Job updated successfully",
        job,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // ADMIN: Assign worker to job
  exports.assignWorkerToJob = async (req, res) => {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
  
      // 1. Validate input
      if (!workerId) {
        return res.status(400).json({ message: "Worker ID is required" });
      }
  
      // 2. Check job exists
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
  
      // 3. Check worker exists
      const worker = await User.findById(workerId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
  
      // 4. Ensure user is actually a WORKER
      if (worker.role !== "WORKER") {
        return res.status(400).json({ message: "User is not a worker" });
      }
  
      // 5. Assign worker to job
      job.assignedWorker = worker._id;
      await job.save();
  
      res.status(200).json({
        message: "Worker assigned to job successfully",
        job,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  };
  