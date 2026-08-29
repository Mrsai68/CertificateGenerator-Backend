import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import StudentProfile from './models/StudentProfile.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Database connection established');

    // 1. Create Default Admin User
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
      console.log('[Seed] Admin user created (username: admin, password: adminpassword123)');
    } else {
      console.log('[Seed] Admin user already exists');
    }

    // 2. Create Default HOD Computer User
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
      console.log('[Seed] HOD Computer user created (username: hod_computer, password: hodpassword123)');
    } else {
      console.log('[Seed] HOD Computer user already exists');
    }

    // 3. Create Sample Student User
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
      console.log('[Seed] Sample student created (username: student1, password: studentpassword123)');
    } else {
      console.log('[Seed] Sample student already exists');
    }

    console.log('[Seed] Data seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
