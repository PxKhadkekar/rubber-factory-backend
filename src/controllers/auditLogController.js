const Job = require("../models/Job");

async function getAuditLogs(req, res) {
  try {
    const jobs = await Job.find({}, "jobNumber auditLogs");

    const logs = jobs.flatMap(job =>
      job.auditLogs.map(log => ({
        _id: log._id,
        jobNumber: job.jobNumber,
        action: log.action,
        role: log.role,
        timestamp: log.timestamp,
      }))
    );
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json(logs);
  } catch (error) {
    console.error("Audit log fetch failed:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
}

module.exports = getAuditLogs;
