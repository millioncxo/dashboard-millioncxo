/**
 * Test script for Resend email integration
 * Run with: tsx scripts/test-email.ts
 */

// Load environment variables FIRST before importing email module
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

// When using Resend's test domain (onboarding@resend.dev), you can only send to your account email
// Set TEST_EMAIL environment variable or update this default to match your Resend account email
const TEST_EMAIL = process.env.TEST_EMAIL || 'millioncxo@gmail.com';

// Helper to avoid rate limiting (Resend allows 2 req/sec)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🧪 Resend Email Integration Test');
  console.log('================================\n');

  // Check if API key is set
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables!');
    console.log('   Please add RESEND_API_KEY to your .env.local file');
    process.exit(1);
  }

  console.log('✅ RESEND_API_KEY found');
  console.log(`   Key prefix: ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`   From Email: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (default)'}`);
  console.log(`\n✅ Test Email: ${TEST_EMAIL}`);

  // Dynamic import AFTER env vars are loaded (fixes import hoisting issue)
  const { sendUpdateEmail, sendAccountCreationEmail, sendInvoiceEmail } = await import('../src/lib/email-resend');

  // Test Update Email
  console.log('\n📧 Testing Update Email...');
  try {
    const result = await sendUpdateEmail({
      client: {
        businessName: 'Test Business Inc.',
        pointOfContactName: 'John Doe',
        pointOfContactEmail: TEST_EMAIL,
        additionalEmails: [],
      },
      update: {
        type: 'MEETING',
        title: 'Test Update - Quarterly Review Meeting',
        description: 'This is a test update to verify email functionality. The meeting was scheduled for next week.',
        date: new Date(),
        sdrName: 'Jane Smith',
        sdrEmail: 'jane@millioncxo.com',
      },
    });

    if (result.success) {
      console.log('✅ Update email sent successfully!');
      console.log(`   Sent to: ${result.sentTo.join(', ')}`);
    } else {
      console.log('❌ Update email failed');
      if (result.errors) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing update email:', error);
  }

  await delay(1500); // Wait 1.5 seconds between requests

  // Test Account Creation Email
  console.log('\n📧 Testing Account Creation Email...');
  try {
    const result = await sendAccountCreationEmail({
      userName: 'Test User',
      userEmail: TEST_EMAIL,
      password: 'TestPassword123!',
      role: 'SDR',
    });

    if (result.success) {
      console.log('✅ Account creation email sent successfully!');
      console.log(`   Email ID: ${result.emailId || 'N/A'}`);
    } else {
      console.log('❌ Account creation email failed');
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Error testing account creation email:', error);
  }

  await delay(1500);

  // Test Invoice Email
  console.log('\n📧 Testing Invoice Email...');
  try {
    // Create a dummy PDF buffer (minimal valid PDF)
    const dummyPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n100\n%%EOF'
    );

    const result = await sendInvoiceEmail({
      client: {
        businessName: 'Test Business Inc.',
        pointOfContactName: 'John Doe',
        pointOfContactEmail: TEST_EMAIL,
        additionalEmails: [],
      },
      invoice: {
        invoiceNumber: 'INV-TEST-2024-01',
        amount: 1500.00,
        currency: 'USD',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        description: 'Monthly service invoice - Test',
      },
      pdfBuffer: dummyPdf,
      pdfFilename: 'invoice-test.pdf',
    });

    if (result.success) {
      console.log('✅ Invoice email sent successfully!');
      console.log(`   Sent to: ${result.sentTo.join(', ')}`);
    } else {
      console.log('❌ Invoice email failed');
      if (result.errors) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing invoice email:', error);
  }

  console.log('\n✨ Test completed!');
  console.log('\nNote: Check your email inbox (and spam folder) to verify emails were received.');
}

main().catch(console.error);
