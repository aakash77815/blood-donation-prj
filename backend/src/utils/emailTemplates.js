// Centralized, plain HTML email templates — keeping them here means the visual
// style stays consistent and there's one place to update the "look" of all emails.

const wrapper = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #DC2626; margin-bottom: 4px;">🩸 Smart Blood Donor Finder</h2>
    <h3 style="color: #333; margin-top: 0;">${title}</h3>
    ${bodyHtml}
    <p style="color: #999; font-size: 12px; margin-top: 32px;">
      This is an automated message — please do not reply directly to this email.
    </p>
  </div>
`;

const passwordResetTemplate = (name, resetUrl) => wrapper(
  'Reset Your Password',
  `
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <a href="${resetUrl}" style="display:inline-block; background:#DC2626; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; margin: 12px 0;">
      Reset Password
    </a>
    <p>This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
  `
);

const requestCreatedTemplate = (name, request) => wrapper(
  'Blood Request Submitted',
  `
    <p>Hi ${name},</p>
    <p>Your blood request for <strong>${request.patientName}</strong> (${request.bloodGroup}) at
    ${request.hospital.name}, ${request.hospital.city} has been submitted successfully.</p>
    <p>We'll notify you as soon as a donor accepts it.</p>
  `
);

const requestAcceptedTemplate = (requesterName, donor, request) => wrapper(
  'A Donor Has Accepted Your Request',
  `
    <p>Hi ${requesterName},</p>
    <p>Good news — <strong>${donor.name}</strong> has agreed to donate for
    <strong>${request.patientName}</strong> (${request.bloodGroup}).</p>
    <p>Donor contact: ${donor.phone} · ${donor.email}</p>
  `
);

const requestFulfilledTemplate = (name, request) => wrapper(
  'Blood Request Fulfilled',
  `
    <p>Hi ${name},</p>
    <p>The blood request for <strong>${request.patientName}</strong> (${request.bloodGroup}) has been
    marked as fulfilled. Thank you for using Smart Blood Donor Finder!</p>
  `
);

module.exports = {
  passwordResetTemplate,
  requestCreatedTemplate,
  requestAcceptedTemplate,
  requestFulfilledTemplate,
};
