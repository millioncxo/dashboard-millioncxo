/**
 * Email template for SDR update notifications to clients
 */

interface UpdateEmailTemplateProps {
  clientName: string;
  businessName: string;
  updateType: string;
  updateTitle: string;
  updateDescription: string;
  updateDate: Date;
  sdrName: string;
}

export function renderUpdateEmailTemplate(props: UpdateEmailTemplateProps): { html: string; text: string } {
  const { clientName, businessName, updateType, updateTitle, updateDescription, updateDate, sdrName } = props;

  const formattedDate = new Date(updateDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updateTypeLabels: Record<string, string> = {
    CALL: 'Phone Call',
    EMAIL: 'Email',
    MEETING: 'Meeting',
    NOTE: 'Note',
    REPORT: 'Report',
    OTHER: 'Update',
  };

  const typeLabel = updateTypeLabels[updateType.toUpperCase()] || updateType;

  // HTML version
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update from MillionCXO</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .update-card {
      background-color: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .update-type {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .update-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 10px 0;
    }
    .update-description {
      color: #4b5563;
      margin: 15px 0;
      white-space: pre-wrap;
    }
    .update-meta {
      color: #6b7280;
      font-size: 14px;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer-text {
      margin: 5px 0;
    }
    .no-reply {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">MillionCXO</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${clientName},</div>
      
      <p>You have received a new update from your SDR regarding <strong>${businessName}</strong>.</p>
      
      <div class="update-card">
        <span class="update-type">${typeLabel}</span>
        <h2 class="update-title">${updateTitle}</h2>
        <div class="update-description">${updateDescription.replace(/\n/g, '<br>')}</div>
        <div class="update-meta">
          <strong>Date:</strong> ${formattedDate}<br>
          <strong>From:</strong> ${sdrName}
        </div>
      </div>
      
      <p>You can view this update and more in your MillionCXO dashboard.</p>
    </div>
    
    <div class="footer">
      <p class="footer-text"><strong>MillionCXO</strong></p>
      <p class="footer-text">Your trusted partner for business growth</p>
      <p class="no-reply">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Plain text version
  const text = `
Hello ${clientName},

You have received a new update from your SDR regarding ${businessName}.

${typeLabel}: ${updateTitle}

${updateDescription}

Date: ${formattedDate}
From: ${sdrName}

You can view this update and more in your MillionCXO dashboard.

---
MillionCXO
Your trusted partner for business growth

This is an automated message. Please do not reply to this email.
  `.trim();

  return { html, text };
}

