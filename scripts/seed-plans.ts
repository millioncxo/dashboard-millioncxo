import mongoose from 'mongoose';
import Plan from '../src/models/Plan';
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

const mongoUri: string = MONGODB_URI;

const plans = [
  {
    name: 'LinkedIn Followers Boost',
    description: 'Build brand authority, one follower at a time',
    pricePerMonth: 499,
    creditsPerMonth: 0, // Not applicable for this plan
    features: [
      '10,000+ targeted followers per month',
      'Organic growth strategy',
      'Content optimization for your brand',
      'Engagement boost'
    ],
    planConfiguration: {
      requiresLicenseCount: false,
      fixedPrice: true, // Fixed price, no license count needed
    }
  },
  {
    name: 'LinkedIn Outreach Excellence 20X',
    description: 'License-based LinkedIn scaling',
    pricePerMonth: 250,
    creditsPerMonth: 0, // Price is per license, not credits
    features: [
      '1,000 InMails per license per month',
      '4 guaranteed prospects per license per month',
      'Research-based outreach using LinkedIn activity',
      '100% money-back guaranteed if your account gets blocked',
      'Zero additional tool costs'
    ],
    planConfiguration: {
      requiresLicenseCount: true,
      pricePerLicense: 250,
      fixedPrice: false,
    }
  },
  {
    name: 'SDR as a Service',
    description: 'Full-time SDR, 4+ CXO meetings/month',
    pricePerMonth: 2000,
    creditsPerMonth: 0, // Not applicable for this plan
    features: [
      '200+ emails/day',
      '150+ cold calls/day',
      '80 ICP profiles researched/day',
      'Target: 4 qualified CXO meetings/month'
    ],
    planConfiguration: {
      requiresSdrCount: true,
      pricePerSdr: 2000,
      fixedPrice: false,
    }
  }
];

async function seedPlans() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let createdCount = 0;
    let updatedCount = 0;

    for (const planData of plans) {
      const existingPlan = await Plan.findOne({ name: planData.name });
      
      if (existingPlan) {
        // Update existing plan, preserving existing data and adding/updating planConfiguration
        const updateData: any = {
          ...planData,
          // Preserve existing fields that might not be in planData
          _id: existingPlan._id,
        };
        await Plan.findByIdAndUpdate(existingPlan._id, updateData, { new: true, runValidators: true });
        console.log(`🔄 Updated plan: ${planData.name} (with planConfiguration)`);
        updatedCount++;
      } else {
        await Plan.create(planData);
        console.log(`✅ Created plan: ${planData.name} (with planConfiguration)`);
        createdCount++;
      }
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Created: ${createdCount} plans`);
    console.log(`   Updated: ${updatedCount} plans`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding plans:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedPlans();

