/**
 * Defines which measurements are editable in each job phase.
 * Backend enforcement only.
 */

const MEASUREMENT_RULES = {
    GRINDING: ["jobLength", "jobOldOd", "jobMsOd", "msWeight"],
  
    SANDBLASTING: [],
  
    AWAITING_ADMIN_APPROVAL: [],
  
    COATING: ["eboniteOd"],
  
    BONDING: ["rubberRoughOd"],
  
    FINISHING: ["finishOd"],
  
    INSPECTION: [],
  
    DISPATCHED: [],
  };
  
  module.exports = MEASUREMENT_RULES;
  