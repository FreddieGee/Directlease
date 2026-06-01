import { sendEmail, buildEmailHtml } from '../mailer';

// --- Viewing Confirmed ---
export async function sendViewingConfirmedEmail(params: {
  tenantEmail: string;
  tenantName: string;
  propertyTitle: string;
  viewingDate: string;
  viewingTime: string;
}) {
  const content = `
    <p>Hi <strong>${params.tenantName}</strong>,</p>
    <p>Your viewing request has been confirmed! Here are the details:</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <div class="info-row"><strong>Property</strong><span>${params.propertyTitle}</span></div>
      <div class="info-row"><strong>Date</strong><span>${params.viewingDate}</span></div>
      <div class="info-row"><strong>Time</strong><span>${params.viewingTime}</span></div>
    </div>
    <p>The property address will be sent to you <strong>2 hours before</strong> the scheduled viewing time.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/viewings" class="btn">View My Viewings</a>
    </p>
  `;

  return sendEmail({
    to: params.tenantEmail,
    subject: `✅ Viewing Confirmed — ${params.propertyTitle}`,
    html: buildEmailHtml(content, 'Viewing Confirmed!'),
  });
}

// --- Viewing Address (sent 2 hours before) ---
export async function sendViewingAddressEmail(params: {
  tenantEmail: string;
  tenantName: string;
  propertyTitle: string;
  viewingDate: string;
  viewingTime: string;
  propertyAddress: string;
}) {
  const content = `
    <p>Hi <strong>${params.tenantName}</strong>,</p>
    <p>Your viewing is coming up soon! Here's the property address:</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <div class="info-row"><strong>Property</strong><span>${params.propertyTitle}</span></div>
      <div class="info-row"><strong>Date</strong><span>${params.viewingDate}</span></div>
      <div class="info-row"><strong>Time</strong><span>${params.viewingTime}</span></div>
      <div class="info-row"><strong>Address</strong><span style="font-weight:600;">${params.propertyAddress}</span></div>
    </div>
    <p>Please arrive on time. If you need to reschedule, contact the landlord through the in-app chat.</p>
  `;

  return sendEmail({
    to: params.tenantEmail,
    subject: `📍 Viewing Address — ${params.propertyTitle}`,
    html: buildEmailHtml(content, 'Property Address'),
  });
}

// --- Viewing Rescheduled ---
export async function sendViewingRescheduledEmail(params: {
  tenantEmail: string;
  tenantName: string;
  propertyTitle: string;
}) {
  const content = `
    <p>Hi <strong>${params.tenantName}</strong>,</p>
    <p>The landlord has rescheduled the viewing for <strong>${params.propertyTitle}</strong>.</p>
    <p>Please check the new available time slots and select a new date that works for you.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/viewings" class="btn">View New Schedule</a>
    </p>
  `;

  return sendEmail({
    to: params.tenantEmail,
    subject: `🔄 Viewing Rescheduled — ${params.propertyTitle}`,
    html: buildEmailHtml(content, 'Viewing Rescheduled'),
  });
}

// --- Reservation Expiry ---
export async function sendReservationExpiryEmail(params: {
  tenantEmail: string;
  tenantName: string;
  propertyTitle: string;
}) {
  const content = `
    <p>Hi <strong>${params.tenantName}</strong>,</p>
    <p>Good news! The property <strong>${params.propertyTitle}</strong> is now available again.</p>
    <p>The previous reservation has expired, so you can now express interest or request a viewing.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/browse" class="btn">Browse Properties</a>
    </p>
  `;

  return sendEmail({
    to: params.tenantEmail,
    subject: `🏠 Property Available Again — ${params.propertyTitle}`,
    html: buildEmailHtml(content, 'Property Now Available'),
  });
}

// --- New Verification Pending (Admin) ---
export async function sendAdminVerificationPendingEmail(params: {
  userName: string;
  userEmail: string;
  userType: string;
}) {
  const content = `
    <p>A new verification request is pending review:</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <div class="info-row"><strong>Name</strong><span>${params.userName}</span></div>
      <div class="info-row"><strong>Email</strong><span>${params.userEmail}</span></div>
      <div class="info-row"><strong>Type</strong><span class="badge">${params.userType}</span></div>
    </div>
    <p style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" class="btn">Review Verifications</a>
    </p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `🔔 New Verification Pending — ${params.userName}`,
    html: buildEmailHtml(content, 'Verification Request'),
  });
}

// --- New Listing Pending Approval (Admin) ---
export async function sendAdminListingPendingEmail(params: {
  propertyTitle: string;
  landlordName: string;
  propertyType: string;
}) {
  const content = `
    <p>A new property listing requires approval:</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <div class="info-row"><strong>Property</strong><span>${params.propertyTitle}</span></div>
      <div class="info-row"><strong>Landlord</strong><span>${params.landlordName}</span></div>
      <div class="info-row"><strong>Type</strong><span class="badge">${params.propertyType}</span></div>
    </div>
    <p style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" class="btn">Review Listings</a>
    </p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `🏠 New Listing Pending — ${params.propertyTitle}`,
    html: buildEmailHtml(content, 'New Listing Approval'),
  });
}

// --- Transaction Confirmation ---
export async function sendTransactionConfirmationEmail(params: {
  email: string;
  name: string;
  propertyTitle: string;
  amount: string;
  transactionRef: string;
}) {
  const content = `
    <p>Hi <strong>${params.name}</strong>,</p>
    <p>Your transaction has been completed successfully!</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <div class="info-row"><strong>Property</strong><span>${params.propertyTitle}</span></div>
      <div class="info-row"><strong>Amount</strong><span style="font-weight:600;color:#059669;">₦${params.amount}</span></div>
      <div class="info-row"><strong>Reference</strong><span style="font-size:12px;">${params.transactionRef}</span></div>
    </div>
    <p>Thank you for using DirectLease!</p>
  `;

  return sendEmail({
    to: params.email,
    subject: `✅ Transaction Complete — ${params.propertyTitle}`,
    html: buildEmailHtml(content, 'Payment Successful!'),
  });
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@directlease.com';