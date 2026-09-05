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

    const existingHod = await User.findOne({ username: 'hod_computer' });
    if (!existingHod) {
      const hodUser = new User({
        username: 'hod_computer',
        email: 'hod.computer@gpmiraj.ac.in',
        password: 'Gpm@hod_comp',
        role: 'ROLE_HOD',
        department: 'Computer Engineering',
        isActive: true
      });
      await hodUser.save();
    }

    const existingStudent = await User.findOne({ username: 'student1' });
    if (!existingStudent) {
      const studentUser = new User({
        username: 'student1',
        email: 'student1@gmail.com',
        password: 'Std1',
        role: 'ROLE_STUDENT',
        department: 'Computer Engineering',
        isActive: true
      });
      const savedStudent = await studentUser.save();

      const profile = new StudentProfile({
        user: savedStudent._id,
        enrollmentNo: '2105120001',
        fullName: 'Rahul Suresh Patil',
        department: 'Computer Engineering',
        yearOfStudy: 'Third Year / Final Year',
        academicYear: '2025-2026',
        gender: 'Male',
        contactNo: '9876543210'
      });
      await profile.save();
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
