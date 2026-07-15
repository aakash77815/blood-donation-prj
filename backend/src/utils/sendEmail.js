const nodemailer = require('nodemailer');

let transporter = null;

// Lazily create the transporter so a missing/invalid email config doesn't crash
// the server at boot — it only matters the moment we actually try to send.
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465, // true for port 465, false for 587/others
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

// Sends an email. Callers should treat this as best-effort — see the
// try/catch usage in controllers, where a failed email must never
// block or fail the underlying action (e.g. creating a blood request
// should still succeed even if the confirmation email bounces).
const sendEmail = async ({ to, subject, html }) => {
  const mailTransporter = getTransporter();

  await mailTransporter.sendMail({
    from: `"Smart Blood Donor Finder" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
