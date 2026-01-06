/**
 * Email template for account creation with credentials
 */

interface AccountCreationEmailTemplateProps {
  userName: string;
  userEmail: string;
  password: string;
  role: 'ADMIN' | 'SDR' | 'CLIENT';
  loginUrl: string;
}

export function renderAccountCreationEmailTemplate(
  props: AccountCreationEmailTemplateProps
): { html: string; text: string } {
  const { userName, userEmail, password, role, loginUrl } = props;

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    SDR: 'Sales Development Representative',
    CLIENT: 'Client',
  };

  const roleLabel = roleLabels[role] || role;

  // HTML version
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MillionCXO</title>
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
    .credentials-box {
      background-color: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-item {
      margin: 15px 0;
    }
    .credential-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .credential-value {
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 10px 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #111827;
      word-break: break-all;
    }
    .password-warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #1d4ed8;
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
      <div class="greeting">Welcome, ${userName}!</div>
      
      <p>Your ${roleLabel} account has been created successfully. Below are your login credentials:</p>
      
      <div class="credentials-box">
        <div class="credential-item">
          <div class="credential-label">Email Address:</div>
          <div class="credential-value">${userEmail}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Password:</div>
          <div class="credential-value">${password}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Role:</div>
          <div class="credential-value">${roleLabel}</div>
        </div>
      </div>
      
      <div class="password-warning">
        <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Login to Dashboard</a>
      </div>
      
      <p style="margin-top: 20px;">If you have any questions or need assistance, please contact your administrator.</p>
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
Welcome, ${userName}!

Your ${roleLabel} account has been created successfully. Below are your login credentials:

Email Address: ${userEmail}
Password: ${password}
Role: ${roleLabel}

⚠️ Important: Please change your password after your first login for security purposes.

Login URL: ${loginUrl}

If you have any questions or need assistance, please contact your administrator.

---
MillionCXO
Your trusted partner for business growth

This is an automated message. Please do not reply to this email.
  `.trim();

  return { html, text };
}

