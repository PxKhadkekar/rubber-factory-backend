const express = require("express");
const getAuditLogs = require("../controllers/auditLogController");
const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();

router.get(
  "/audit-logs",
  authMiddleware,
  authorize("ADMIN"),
  getAuditLogs
);

module.exports = router;
