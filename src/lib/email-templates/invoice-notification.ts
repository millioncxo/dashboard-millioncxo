/**
 * Email template for invoice notifications to clients
 * Clean, professional design with MillionCXO branding
 */

interface InvoiceEmailTemplateProps {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  invoiceDate: Date;
  dueDate: Date;
  description?: string;
}

export function renderInvoiceEmailTemplate(props: InvoiceEmailTemplateProps): { html: string; text: string } {
  const { clientName, businessName, invoiceNumber, amount, currency, invoiceDate, dueDate, description } = props;

  const formattedInvoiceDate = new Date(invoiceDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);

  // Clean, professional HTML template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} from MillionCXO</title>
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
                  <td align="right">
                    <span style="font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Invoice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">Invoice for ${businessName}</h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #71717a; line-height: 1.5;">Hello ${clientName}, please find your invoice details below.</p>
              
              <!-- Invoice Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
                <tr>
                  <td style="padding: 24px;">
                    
                    <!-- Invoice Number -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e4e4e7;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Invoice Number</p>
                          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #18181b;">${invoiceNumber}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Dates Row -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td width="50%" valign="top">
                          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Invoice Date</p>
                          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #3f3f46;">${formattedInvoiceDate}</p>
                        </td>
                        <td width="50%" valign="top">
                          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Due Date</p>
                          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #3f3f46;">${formattedDueDate}</p>
                        </td>
                      </tr>
                    </table>
                    
                    ${description ? `
                    <!-- Description -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Description</p>
                          <p style="margin: 0; font-size: 14px; color: #3f3f46; line-height: 1.5;">${description.replace(/\n/g, '<br>')}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    <!-- Amount -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181b; border-radius: 8px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
                          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">${formattedAmount}</p>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
              
              <!-- Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #f0fdf4; border-radius: 6px; border-left: 4px solid #22c55e;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.5;">
                      <strong>📎 Attachment:</strong> A PDF copy of this invoice is attached to this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.5;">If you have any questions about this invoice, please contact your account manager.</p>
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

Please find your invoice details for ${businessName}.

Invoice Number: ${invoiceNumber}
Invoice Date: ${formattedInvoiceDate}
Due Date: ${formattedDueDate}
${description ? `Description: ${description}\n` : ''}
Amount Due: ${formattedAmount}

📎 Attachment: A PDF copy of this invoice is attached to this email.

If you have any questions, please contact your account manager.

---
MillionCXO · Your Growth Partner

This is an automated message. Please do not reply to this email.
  `.trim();

  return { html, text };
}
