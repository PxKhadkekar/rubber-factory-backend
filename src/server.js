const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const roleTestRoutes = require("./routes/roleTestRoutes");
const jobRoutes = require("./routes/jobRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();
connectDB();

const app = express();

/* ================================
   CORS — MUST BE FIRST
   ================================ */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://rubber-factory-frontend.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* Handle preflight requests explicitly */
app.options("*", cors());

/* ================================
   BODY PARSER
   ================================ */
app.use(express.json());

/* ================================
   ROUTES
   ================================ */
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/role-test", roleTestRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);

/* ================================
   HEALTH CHECK
   ================================ */
app.get("/", (req, res) => {
  res.send("Rubber Factory Backend is running");
});

/* ================================
   SERVER
   ================================ */
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
