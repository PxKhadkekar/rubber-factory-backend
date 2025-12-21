const express = require("express");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");
const User = require("../models/User");

const router = express.Router();

// ADMIN: Get all workers
router.get(
  "/workers",
  authMiddleware,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const workers = await User.find({ role: "WORKER" }).select(
        "_id name email"
      );
      res.status(200).json(workers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
