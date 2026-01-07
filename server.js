const express = require('express');
const cors = require('cors');
const dotenv =require('dotenv');
const connectDB = require('./database'); 
const User = require('./models/User'); 
const bcrypt = require('bcryptjs'); 

// Load environment variables from .env file
dotenv.config();

// --- Initialize App ---
const app = express();

// --- Middleware ---
app.use(cors({
    origin: ["http://localhost:5173", "https://https://real-estate-frontend-liard-rho.vercel.app"], // Add your frontend URLs here
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// --- Define API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// --- Port Configuration ---
const PORT = process.env.PORT || "https://https://real-estate-backend-nine-eta.vercel.app";

// --- Seed Admin User ---
const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set in .env. Skipping admin seed.');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      

      await User.create({
        email: adminEmail,
        password: adminPassword, 
        role: 'admin'
      });
      

      console.log('Default admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }

  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
};

// --- Start Server & Connect to DB ---
const startServer = async () => {
  try {
    await connectDB();
    await seedAdminUser(); 
    app.get('/', (req, res) => {
  res.send('Server is running! The backend is active.');
});

    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

// Call the function to start the server
startServer();

