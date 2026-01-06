import { Resend } from 'resend';
import { logger } from './logger';
import { renderUpdateEmailTemplate } from './email-templates/update-notification';
import { renderAccountCreationEmailTemplate } from './email-templates/account-creation';
import { renderInvoiceEmailTemplate } from './email-templates/invoice-notification';

// Lazy initialization of Resend client
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (resend) {
    return resend;
  }
  
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY not found in environment variables. Email sending will be disabled.');
    return null;
  }
  
  resend = new Resend(resendApiKey);
  return resend;
}

// Email configuration
// For testing: use onboarding@resend.dev (no verification needed)
// For production: use your verified domain e.g., updates@millioncxo.com
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = 'MillionCXO';

/**
 * Get all email addresses for a client (primary + additional)
 */
export function getClientEmailAddresses(client: {
  pointOfContactEmail: string;
  additionalEmails?: string[];
}): string[] {
  const emails: string[] = [client.pointOfContactEmail];
  
  if (client.additionalEmails && Array.isArray(client.additionalEmails)) {
    // Filter out duplicates and invalid emails
    const additional = client.additionalEmails
      .filter(email => email && typeof email === 'string' && email.trim() !== '')
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      .map(email => email.trim().toLowerCase());
    
    // Add unique additional emails
    additional.forEach(email => {
      if (!emails.includes(email)) {
        emails.push(email);
      }
    });
  }
  
  return emails;
}

/**
 * Send update notification email to client
 */
export async function sendUpdateEmail(params: {
  client: {
    businessName: string;
    pointOfContactName: string;
    pointOfContactEmail: string;
    additionalEmails?: string[];
  };
  update: {
    type: string;
    title: string;
    description: string;
    date: Date;
    sdrName: string;
    sdrEmail?: string;
  };
}): Promise<{ success: boolean; sentTo: string[]; errors?: string[] }> {
  const resendClient = getResendClient();
  if (!resendClient) {
    logger.warn('Resend client not initialized. Email not sent.', { updateId: params.update.title });
    return { success: false, sentTo: [], errors: ['Resend client not initialized'] };
  }

  try {
    const recipientEmails = getClientEmailAddresses(params.client);
    const sentTo: string[] = [];
    const errors: string[] = [];

    // Send individual emails to each recipient for better deliverability
    for (const email of recipientEmails) {
      try {
        const { html, text } = renderUpdateEmailTemplate({
          clientName: params.client.pointOfContactName,
          businessName: params.client.businessName,
          updateType: params.update.type,
          updateTitle: params.update.title,
          updateDescription: params.update.description,
          updateDate: params.update.date,
          sdrName: params.update.sdrName,
        });

        const result = await resendClient.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: email,
          subject: `Update: ${params.update.title}`,
          html,
          text,
        });

        if (result.error) {
          logger.error('Failed to send update email', result.error, { email, updateTitle: params.update.title });
          errors.push(`${email}: ${result.error.message || 'Unknown error'}`);
        } else {
          logger.info('Update email sent successfully', { email, updateTitle: params.update.title, emailId: result.data?.id });
          sentTo.push(email);
        }
      } catch (error) {
        logger.error('Error sending update email', error, { email, updateTitle: params.update.title });
        errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: sentTo.length > 0,
      sentTo,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    logger.error('Error in sendUpdateEmail', error, { clientId: params.client.businessName });
    return { success: false, sentTo: [], errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

/**
 * Send account creation email with credentials
 */
export async function sendAccountCreationEmail(params: {
  userName: string;
  userEmail: string;
  password: string;
  role: 'ADMIN' | 'SDR' | 'CLIENT';
  loginUrl?: string;
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const resendClient = getResendClient();
  if (!resendClient) {
    logger.warn('Resend client not initialized. Email not sent.', { userEmail: params.userEmail });
    return { success: false, error: 'Resend client not initialized' };
  }

  try {
    const loginUrl = params.loginUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const fullLoginUrl = `${loginUrl}/login`;

    const { html, text } = renderAccountCreationEmailTemplate({
      userName: params.userName,
      userEmail: params.userEmail,
      password: params.password,
      role: params.role,
      loginUrl: fullLoginUrl,
    });

    const result = await resendClient.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.userEmail,
      subject: `Welcome to MillionCXO - Your Account Details`,
      html,
      text,
    });

    if (result.error) {
      logger.error('Failed to send account creation email', result.error, { userEmail: params.userEmail });
      return { success: false, error: result.error.message || 'Unknown error' };
    }

    logger.info('Account creation email sent successfully', {
      userEmail: params.userEmail,
      role: params.role,
      emailId: result.data?.id,
    });

    return { success: true, emailId: result.data?.id };
  } catch (error) {
    logger.error('Error sending account creation email', error, { userEmail: params.userEmail });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send invoice notification email with PDF attachment
 */
export async function sendInvoiceEmail(params: {
  client: {
    businessName: string;
    pointOfContactName: string;
    pointOfContactEmail: string;
    additionalEmails?: string[];
  };
  invoice: {
    invoiceNumber: string;
    amount: number;
    currency: string;
    invoiceDate: Date;
    dueDate: Date;
    description?: string;
  };
  pdfBuffer: Buffer;
  pdfFilename: string;
}): Promise<{ success: boolean; sentTo: string[]; errors?: string[] }> {
  const resendClient = getResendClient();
  if (!resendClient) {
    logger.warn('Resend client not initialized. Email not sent.', { invoiceNumber: params.invoice.invoiceNumber });
    return { success: false, sentTo: [], errors: ['Resend client not initialized'] };
  }

  try {
    // Validate PDF size (Resend has 20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (params.pdfBuffer.length > maxSize) {
      logger.error('PDF file too large for email attachment', null, {
        invoiceNumber: params.invoice.invoiceNumber,
        size: params.pdfBuffer.length,
        maxSize,
      });
      return { success: false, sentTo: [], errors: ['PDF file too large for email attachment'] };
    }

    const recipientEmails = getClientEmailAddresses(params.client);
    const sentTo: string[] = [];
    const errors: string[] = [];

    // Send individual emails to each recipient
    for (const email of recipientEmails) {
      try {
        const { html, text } = renderInvoiceEmailTemplate({
          clientName: params.client.pointOfContactName,
          businessName: params.client.businessName,
          invoiceNumber: params.invoice.invoiceNumber,
          amount: params.invoice.amount,
          currency: params.invoice.currency,
          invoiceDate: params.invoice.invoiceDate,
          dueDate: params.invoice.dueDate,
          description: params.invoice.description,
        });

        const result = await resendClient.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: email,
          subject: `Invoice ${params.invoice.invoiceNumber} from MillionCXO`,
          html,
          text,
          attachments: [
            {
              filename: params.pdfFilename,
              content: params.pdfBuffer,
            },
          ],
        });

        if (result.error) {
          logger.error('Failed to send invoice email', result.error, {
            email,
            invoiceNumber: params.invoice.invoiceNumber,
          });
          errors.push(`${email}: ${result.error.message || 'Unknown error'}`);
        } else {
          logger.info('Invoice email sent successfully', {
            email,
            invoiceNumber: params.invoice.invoiceNumber,
            emailId: result.data?.id,
          });
          sentTo.push(email);
        }
      } catch (error) {
        logger.error('Error sending invoice email', error, {
          email,
          invoiceNumber: params.invoice.invoiceNumber,
        });
        errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: sentTo.length > 0,
      sentTo,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    logger.error('Error in sendInvoiceEmail', error, { invoiceNumber: params.invoice.invoiceNumber });
    return { success: false, sentTo: [], errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

