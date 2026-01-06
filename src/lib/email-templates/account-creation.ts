/**
 * Email template for account creation with credentials
 * Clean, professional design with MillionCXO branding
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

  // Clean, professional HTML template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MillionCXO</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e4e4e7;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 700; color: #18181b; letter-spacing: -0.5px;">Million</span><span style="font-size: 24px; font-weight: 700; color: #a19250; letter-spacing: -0.5px;">CXO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">Welcome to MillionCXO!</h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #71717a; line-height: 1.5;">Hello ${userName}, your <strong style="color: #3f3f46;">${roleLabel}</strong> account has been created.</p>
              
              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: 600; color: #3f3f46; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>
                    
                    <!-- Email -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Email Address</p>
                          <p style="margin: 0; padding: 12px 16px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px; font-size: 14px; color: #18181b; font-family: 'SF Mono', Monaco, monospace;">${userEmail}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Password -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Password</p>
                          <p style="margin: 0; padding: 12px 16px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px; font-size: 14px; color: #18181b; font-family: 'SF Mono', Monaco, monospace;">${password}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Role -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Role</p>
                          <span style="display: inline-block; padding: 6px 14px; background-color: #18181b; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600;">${roleLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #fef9c3; border-radius: 6px; border-left: 4px solid #eab308;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; color: #854d0e; line-height: 1.5;">
                      <strong>Security Notice:</strong> Please change your password after your first login.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Login to Dashboard →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.5; text-align: center;">If you have any questions, please contact your administrator.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center;">
                <span style="font-weight: 600; color: #3f3f46;">MillionCXO</span> · Your Growth Partner
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain text version
  const text = `
Welcome to MillionCXO, ${userName}!

Your ${roleLabel} account has been created. Here are your login credentials:

Email Address: ${userEmail}
Password: ${password}
Role: ${roleLabel}

Security Notice: Please change your password after your first login.

Login URL: ${loginUrl}

If you have any questions, please contact your administrator.

---
MillionCXO · Your Growth Partner

This is an automated message. Please do not reply to this email.
  `.trim();

  return { html, text };
}
