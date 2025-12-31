exports.addAuditLog = (job, log) => {
    job.auditLogs.push({
      ...log,
      timestamp: new Date(),
    });
  };
  