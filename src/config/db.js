const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Attempting MongoDB connection...");

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 5000, // force fail instead of hanging
      family: 4, // force IPv4 (important)
    });

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
