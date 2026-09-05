import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import StudentProfile from './models/StudentProfile.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ username: 'Admin' });
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'Admin',
        email: 'admin@gpmiraj.ac.in',
        password: 'Gpm@admin',
        role: 'ROLE_ADMIN',
        department: 'ALL',
        isActive: true
      });
      await adminUser.save();
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
