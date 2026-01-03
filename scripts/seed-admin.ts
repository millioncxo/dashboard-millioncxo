import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import { encryptPassword } from '../src/lib/password-encryption';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️  .env file not found, using environment variables');
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  console.error('Please make sure .env file exists with MONGODB_URI');
  process.exit(1);
}

// TypeScript now knows MONGODB_URI is defined after the check
const mongoUri: string = MONGODB_URI;

const ADMIN_EMAIL = 'millioncxo@gmail.com';
const ADMIN_PASSWORD = '12345678';
const ADMIN_NAME = 'MillionCXO Admin';

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', ADMIN_EMAIL);
      console.log('   Skipping creation. If you want to reset, delete the user first.');
      await mongoose.disconnect();
      return;
    }

    // Hash password (for authentication)
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    // Encrypt password (for admin viewing)
    console.log('🔒 Encrypting password...');
    const passwordEncrypted = encryptPassword(ADMIN_PASSWORD);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      passwordEncrypted,
      role: 'ADMIN',
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('👤 Name:', ADMIN_NAME);
    console.log('🆔 User ID:', admin._id);
    console.log('\n✨ You can now login at http://localhost:3001/login');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate email - admin user may already exist');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();

