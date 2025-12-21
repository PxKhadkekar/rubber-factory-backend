const express = require("express");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

const {
  createJob,
  getAllJobsAdmin,
  getMyJobsWorker,
  updateJobByWorker,
  assignWorkerToJob,
} = require("../controllers/jobController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

// Create new job
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createJob
);

// Get all jobs (admin view)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllJobsAdmin
);

// Assign worker to job
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

// Get jobs assigned to logged-in worker
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("WORKER"),
  getMyJobsWorker
);

// Update job status / measurements by worker
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("WORKER"),
  updateJobByWorker
);

module.exports = router;
