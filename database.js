const mongoose = require('mongoose');

const connectDB = async () => {
  
  const MONGO_URI = process.env.MONGO_URI;

  
  if (!MONGO_URI) {
    console.error('MongoDB connection error: MONGO_URI not defined. Check your .env file.');
    process.exit(1); 
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    
    process.exit(1);
  }
};

module.exports = connectDB;
