import mongoose from 'mongoose';
import Client from '../src/models/Client';
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

async function checkClientData() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the specific client
    const clientId = '69280f805105bc005e59dcae';
    const client = await Client.findById(clientId).lean();

    if (!client) {
      console.log('❌ Client not found');
      process.exit(1);
    }

    console.log('\n📊 CLIENT DATA IN DATABASE:');
    console.log('================================');
    console.log('ID:', client._id);
    console.log('Business Name:', client.businessName);
    console.log('Number of Licenses:', client.numberOfLicenses);
    console.log('Payment Status:', client.paymentStatus);
    console.log('Payment Details:', JSON.stringify(client.paymentDetails, null, 2));
    console.log('================================\n');

    // Also check raw MongoDB document
    if (!mongoose.connection.db) {
      console.error('❌ Error: MongoDB connection database is not available');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    const rawClient = await mongoose.connection.db
      .collection('clients')
      .findOne({ _id: new mongoose.Types.ObjectId(clientId) });

    console.log('📦 RAW MONGODB DOCUMENT:');
    console.log('================================');
    console.log('numberOfLicenses:', rawClient?.numberOfLicenses);
    console.log('paymentStatus:', rawClient?.paymentStatus);
    console.log('paymentDetails:', JSON.stringify(rawClient?.paymentDetails, null, 2));
    console.log('================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkClientData();

