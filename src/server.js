const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const roleTestRoutes = require("./routes/roleTestRoutes");
const jobRoutes = require("./routes/jobRoutes");
const userRoutes = require("./routes/userRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");


dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://rubber-factory-frontend.vercel.app",
];

/* ================================
   SOCKET.IO SETUP
   ================================ */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

/* ================================
   CORS — MUST BE FIRST
   ================================ */
app.use(
  cors({
    origin: allowedOrigins,
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
app.use("/api", auditLogRoutes);

/* ================================
   HEALTH CHECK
   ================================ */
app.get("/", (req, res) => {
  res.send("Rubber Factory Backend is running with Socket.IO");
});

/* ================================
   SERVER
   ================================ */
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
