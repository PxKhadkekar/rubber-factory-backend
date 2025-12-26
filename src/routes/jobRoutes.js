const express = require("express");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

const {
  createJob,
  getAllJobsAdmin,
  getMyJobsWorker,
  updateJobByWorker,
  assignWorkerToJob,
  approveJob,
} = require("../controllers/jobController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

// Create job
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createJob
);

// Get all jobs
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllJobsAdmin
);

// ✅ Approve job (IMPORTANT: before "/:id")
router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("ADMIN"),
  approveJob
);

// Assign worker
router.patch(
  "/:id/assign",
  authMiddleware,
  roleMiddleware("ADMIN"),
  assignWorkerToJob
);

/*
|--------------------------------------------------------------------------
| WORKER ROUTES
|--------------------------------------------------------------------------
*/

// Get jobs for logged-in worker
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("WORKER"),
  getMyJobsWorker
);

// Update job by worker
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("WORKER"),
  updateJobByWorker
);

module.exports = router;
