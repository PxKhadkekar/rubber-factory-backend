/**
 * High-level job workflow.
 * Order matters. Do not change casually.
 */
const JOB_STATUS_FLOW = [
    "RECEIVED",
    "GRINDING",
    "SANDBLASTING",
    "COATING",
    "BONDING",
    "FINISHING",
    "INSPECTION",
    "DISPATCHED",
  ];
  
  module.exports = JOB_STATUS_FLOW;
  