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
  getJobById,
} = require("../controllers/jobController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

// Create job (ADMIN)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createJob
);

// Get all jobs (ADMIN)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllJobsAdmin
);

// Approve job (ADMIN) — MUST be before "/:id"
router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("ADMIN"),
  approveJob
);

// Assign worker (ADMIN)
router.patch(
  "/:id/assign",
  authMiddleware,
  roleMiddleware("ADMIN"),
  assignWorkerToJob
);

/*
|--------------------------------------------------------------------------
| WORKER ROUTES (⚠️ SPECIFIC FIRST)
|--------------------------------------------------------------------------
*/

// ✅ THIS MUST COME BEFORE "/:id"
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

/*
|--------------------------------------------------------------------------
| SHARED / GENERIC ROUTES (⚠️ ALWAYS LAST)
|--------------------------------------------------------------------------
*/

// Get single job by ID (ADMIN + WORKER)
router.get(
  "/:id",
  authMiddleware,
  getJobById
);

module.exports = router;
