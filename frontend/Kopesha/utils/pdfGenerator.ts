import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// HTML template for the POS receipt
const htmlTemplate = (data: {
  customerName: string;
  amountPaid: string;
  withdrawalFees: string;
  paymentMethod: string;
  paymentDate: string;
  companyLogo?: string; // Optional logo URL
}) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', monospace;
          width: 80mm;
          padding: 5mm;
          margin: 0;
          font-size: 12px;
          line-height: 1.2;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .logo {
          max-width: 60mm;
          height: auto;
          margin: 0 auto 5px;
          display: block;
        }
        .company-name {
          font-size: 14px;
          font-weight: bold;
        }
        .company-address {
          font-size: 10px;
          margin: 5px 0;
        }
        .branch {
          font-size: 12px;
        }
        .receipt-marker {
          text-align: center;
          font-size: 12px;
          margin: 10px 0;
          font-weight: bold;
        }
        .details {
          margin: 10px 0;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        .amount {
          font-weight: bold;
        }
        .divider {
          border-bottom: 1px dashed #000;
          margin: 5px 0;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 10px;
          border-top: 1px dashed #000;
          padding-top: 5px;
        }
        .receipt-no {
          text-align: center;
          font-size: 10px;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${data.companyLogo ? `<img src="${data.companyLogo}" class="logo" alt="Company Logo">` : ''}
        <div class="company-name">RETAWA FINANCIAL SERVICES</div>
        <div class="company-address">
          Kilala, USA RIVER<br>
          Arusha, Tanzania<br>
          Tel: +255 (0) 767 943 766 | +255 (0) 712 949 006<br>
          Email: info@retawa.co.tz
        </div>
        <div class="branch">Main Branch</div>
      </div>
      
      <div class="receipt-marker">*** START OF LEGAL RECEIPT ***</div>
      
      <div class="receipt-no">
        Receipt #: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
      </div>
      
      <div class="details">
        <div class="details-row">
          <span>Date:</span>
          <span>${data.paymentDate}</span>
        </div>
        <div class="details-row">
          <span>Customer Name:</span>
          <span>${data.customerName}</span>
        </div>
        <div class="divider"></div>
        <div class="details-row">
          <span>Amount Paid:</span>
          <span class="amount">TSH ${data.amountPaid}</span>
        </div>
        <div class="details-row">
          <span>Withdrawal Fees:</span>
          <span>TSH ${data.withdrawalFees}</span>
        </div>
        <div class="details-row">
          <span>Payment method:</span>
          <span>${data.paymentMethod}</span>
        </div>
        <div class="divider"></div>
        <div class="details-row">
          <span>Total:</span>
          <span class="amount">TSH ${(parseInt(data.amountPaid) + parseInt(data.withdrawalFees)).toLocaleString()}</span>
        </div>
      </div>

      <div class="receipt-marker">*** END OF LEGAL RECEIPT ***</div>

      <div class="footer">
        Thank you for choosing Retawa Financial Services!
        <br>
        **** Keep this receipt for your records ****
      </div>
    </body>
  </html>
`;

// Function to generate and share the PDF
export const generateReceiptPDF = async (data: {
  customerName: string;
  amountPaid: string;
  withdrawalFees: string;
  paymentMethod: string;
  paymentDate: string;
  companyLogo?: string; // Optional logo URL
}) => {
  try {
    const html = htmlTemplate(data);
    
    const { uri } = await Print.printToFileAsync({
      html,
      // Set page size to match thermal paper width
      width: 302, // 80mm ≈ 302px at 96 DPI
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Receipt'
    });

    console.log('POS receipt generated and shared successfully:', uri);
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw new Error('Failed to generate receipt. Please try again.');
  }
};