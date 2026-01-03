import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// TypeScript type narrowing
const mongoUri: string = MONGODB_URI;

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('📍 Connection string format:', mongoUri.replace(/:[^@]+@/, ':****@'));
    
    await mongoose.connect(mongoUri);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test a simple query
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      console.log('📊 Collections found:', collections.length);
    } else {
      console.log('⚠️  Database object not available');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔍 Troubleshooting steps:');
      console.error('1. Verify username and password in MongoDB Atlas');
      console.error('2. Check if the database user exists in Atlas → Database Access');
      console.error('3. Ensure password is URL-encoded (e.g., @ becomes %40)');
      console.error('4. Verify IP whitelist in Atlas → Network Access');
      console.error('5. Try resetting the database user password in Atlas');
    }
    
    process.exit(1);
  }
}

testConnection();

