require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await User.findOne({ email: 'admin@factory.com' }).select('+password');
  if (admin) {
    const isMatch = await bcrypt.compare('StrongPassword123', admin.password);
    console.log("Password matches:", isMatch);
    
    const isMatch2 = await bcrypt.compare('rubber@1528', admin.password);
    console.log("rubber@1528 matches:", isMatch2);
  } else {
    console.log("Admin not found");
  }
  process.exit(0);
}).catch(console.error);
