const mongoose = require("mongoose");

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

  try {
    const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rubberFactoryDB";
    try {
      await connectWithUri(primaryUri);
      console.log(`MongoDB connected (${primaryUri.split("@").pop()})`);
    } catch (err) {
      if (primaryUri !== "mongodb://127.0.0.1:27017/rubberFactoryDB") {
        console.warn(`Primary MongoDB connection failed (${err.message}). Attempting fallback to local MongoDB...`);
        await connectWithUri("mongodb://127.0.0.1:27017/rubberFactoryDB");
        console.log("Connected to local MongoDB at mongodb://127.0.0.1:27017/rubberFactoryDB");
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
