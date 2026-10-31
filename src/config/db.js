const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const seedAdminIfEmpty = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash("StrongPassword123", 10);
      await User.create({
        name: "Admin",
        email: "admin@factory.com",
        password: hashedPassword,
        role: "ADMIN",
      });
      console.log("Default admin account auto-seeded (admin@factory.com / StrongPassword123)");
    }
  } catch (err) {
    console.error("Auto-seed error:", err.message);
  }
};

const connectDB = async () => {
  console.log("Attempting MongoDB connection...");

  const connectWithUri = async (uri) => {
    const isSrv = uri.includes("mongodb+srv://");
    const options = isSrv
      ? {
          tls: true,
          tlsAllowInvalidCertificates: true,
          serverSelectionTimeoutMS: 5000,
          family: 4,
        }
      : {
          serverSelectionTimeoutMS: 5000,
        };
    await mongoose.connect(uri, options);
  };

  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rubberFactoryDB";

  try {
    await connectWithUri(primaryUri);
    console.log(`MongoDB connected (${primaryUri.split("@").pop()})`);
    await seedAdminIfEmpty();
  } catch (err) {
    console.warn(`Primary MongoDB connection failed (${err.message}).`);
    if (primaryUri !== "mongodb://127.0.0.1:27017/rubberFactoryDB") {
      try {
        console.log("Attempting fallback to local MongoDB...");
        await connectWithUri("mongodb://127.0.0.1:27017/rubberFactoryDB");
        console.log("Connected to local MongoDB at mongodb://127.0.0.1:27017/rubberFactoryDB");
        await seedAdminIfEmpty();
      } catch (localErr) {
        console.error("Local fallback also unavailable:", localErr.message);
        setTimeout(connectDB, 10000);
      }
    } else {
      setTimeout(connectDB, 10000);
    }
  }
};

module.exports = connectDB;
