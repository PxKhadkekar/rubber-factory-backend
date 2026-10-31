require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find();
  console.log("Users in DB:", users.map(u => ({ email: u.email, role: u.role, name: u.name })));
  process.exit(0);
}).catch(console.error);
