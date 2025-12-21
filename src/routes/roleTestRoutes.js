const express = require("express");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

const router = express.Router();

// Admin-only route
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

// Worker-only route
router.get(
  "/worker",
  authMiddleware,
  roleMiddleware("WORKER"),
  (req, res) => {
    res.json({ message: "Welcome Worker" });
  }
);

module.exports = router;
