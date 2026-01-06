/**
 * Email template for SDR update notifications to clients
 * Clean, professional design with MillionCXO branding
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

  // Clean, professional HTML template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update from MillionCXO</title>
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
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">New Update for ${businessName}</h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #71717a; line-height: 1.5;">Hello ${clientName}, you have a new update from your account manager.</p>
              
              <!-- Update Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="display: inline-block; background-color: #a19250; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${typeLabel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #18181b; line-height: 1.4;">${updateTitle}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px;">
                          <p style="margin: 0; font-size: 14px; color: #3f3f46; line-height: 1.6;">${updateDescription.replace(/\n/g, '<br>')}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; border-top: 1px solid #e4e4e7; margin-top: 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                            <tr>
                              <td style="font-size: 13px; color: #71717a;">
                                <strong style="color: #3f3f46;">Date:</strong> ${formattedDate}
                              </td>
                            </tr>
                            <tr>
                              <td style="font-size: 13px; color: #71717a; padding-top: 4px;">
                                <strong style="color: #3f3f46;">From:</strong> ${sdrName}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.5;">View all your updates and more details in your MillionCXO dashboard.</p>
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
Hello ${clientName},

You have received a new update from your SDR regarding ${businessName}.

${typeLabel}: ${updateTitle}

${updateDescription}

Date: ${formattedDate}
From: ${sdrName}

View all your updates in your MillionCXO dashboard.

---
MillionCXO · Your Growth Partner

This is an automated message. Please do not reply to this email.
  `.trim();

  return { html, text };
}
