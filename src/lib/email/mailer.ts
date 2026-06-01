import nodemailer from 'nodemailer';

const isDev = process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST;

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@directlease.com';
const FROM_NAME = 'DirectLease';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@directlease.com';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  if (isDev) {
    // In development, log the email instead of sending
    console.log('=== EMAIL NOTIFICATION (DEV MODE) ===');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.html.substring(0, 500)}...`);
    console.log('========================================');
    return { success: true, devMode: true, messageId: `dev-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw — email failures shouldn't block the main flow
    return { success: false, error };
  }
}

// Build HTML email with common template
export function buildEmailHtml(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header .tagline { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 5px; }
    .body { background: white; padding: 30px; border-radius: 0 0 12px 12px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; color: #92400e; font-size: 13px; margin: 15px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DirectLease</h1>
      <div class="tagline">No Agents. Direct Deals.</div>
    </div>
    <div class="body">
      <h2 style="margin-top:0; color:#111827;">${title}</h2>
      ${content}
      <div class="warning">
        ⚠️ Keep all communications within the DirectLease platform. 
        External communication may limit our ability to assist with dispute resolution.
      </div>
    </div>
    <div class="footer">
      <p>DirectLease &mdash; No Agents. Direct Deals.</p>
      <p>This is an automated message from DirectLease. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;
}