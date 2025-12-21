const express = require("express");
const { registerAdmin, registerWorker, login } = require("../controllers/authController");


const router = express.Router();



router.post("/register-admin", registerAdmin);
router.post("/register-worker", registerWorker);
router.post("/login", login);


module.exports = router;
