/**
 * Email template for invoice notifications to clients
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

  // HTML version
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} from MillionCXO</title>
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
    .invoice-box {
      background-color: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      padding: 25px;
      margin: 20px 0;
    }
    .invoice-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .invoice-number {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .detail-item {
      margin: 10px 0;
    }
    .detail-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 5px;
      font-weight: 500;
    }
    .detail-value {
      font-size: 16px;
      color: #1f2937;
      font-weight: 600;
    }
    .amount-box {
      background-color: #ffffff;
      border: 2px solid #2563eb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .amount-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: 700;
      color: #2563eb;
    }
    .description {
      margin: 20px 0;
      padding: 15px;
      background-color: #ffffff;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
      color: #4b5563;
    }
    .attachment-note {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #1e40af;
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
      
      <p>Please find attached the invoice for <strong>${businessName}</strong>.</p>
      
      <div class="invoice-box">
        <div class="invoice-header">
          <h2 class="invoice-number">Invoice ${invoiceNumber}</h2>
        </div>
        
        <div class="invoice-details">
          <div class="detail-item">
            <div class="detail-label">Invoice Date</div>
            <div class="detail-value">${formattedInvoiceDate}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Due Date</div>
            <div class="detail-value">${formattedDueDate}</div>
          </div>
        </div>
        
        ${description ? `
        <div class="description">
          <strong>Description:</strong><br>
          ${description.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
        
        <div class="amount-box">
          <div class="amount-label">Total Amount</div>
          <div class="amount-value">${formattedAmount}</div>
        </div>
      </div>
      
      <div class="attachment-note">
        <strong>📎 Attachment:</strong> A PDF copy of this invoice is attached to this email for your records.
      </div>
      
      <p>If you have any questions about this invoice, please contact your account manager.</p>
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

Please find attached the invoice for ${businessName}.

Invoice Number: ${invoiceNumber}
Invoice Date: ${formattedInvoiceDate}
Due Date: ${formattedDueDate}
${description ? `Description: ${description}\n` : ''}
Total Amount: ${formattedAmount}

📎 Attachment: A PDF copy of this invoice is attached to this email for your records.

If you have any questions about this invoice, please contact your account manager.

---
MillionCXO
Your trusted partner for business growth

This is an automated message. Please do not reply to this email.
  `.trim();

  return { html, text };
}

