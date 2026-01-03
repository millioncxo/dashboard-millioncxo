type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  link?: string;
};

// Minimal stub for sending email; replace with provider integration (SendGrid/SES/Resend)
export async function sendEmailMinimal({ to, subject, text, link }: SendEmailInput) {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { sent: false, reason: 'invalid-email' };
  }
  // Placeholder: log instead of actually sending
  console.log('EMAIL_OUTBOUND', { to, subject, text, link });
  return { sent: true };
}

