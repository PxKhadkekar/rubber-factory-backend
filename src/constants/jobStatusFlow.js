/**
 * High-level job workflow.
 * Order matters. Do not change casually.
 */
const JOB_STATUS_FLOW = [
    "RECEIVED",
    "GRINDING",
    "SANDBLASTING",
    "AWAITING_ADMIN_APPROVAL",
    "COATING",
    "BONDING",
    "FINISHING",
    "INSPECTION",
    "DISPATCHED",
  ];
  
  module.exports = JOB_STATUS_FLOW;
  