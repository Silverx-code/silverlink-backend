const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.email.host) return null; // email not configured — dev/no-op mode

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: Number(config.email.port) || 587,
    secure: false,
    auth: config.email.user ? { user: config.email.user, pass: config.email.password } : undefined,
    // A reachable SMTP provider responds in well under this — if it doesn't, something's
    // actually wrong (wrong host, network issue, provider outage), and failing fast beats
    // hanging for minutes even though sendMail() below no longer lets that failure block
    // the caller either way.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    // No email provider configured — log instead of failing the request
    console.log(`[email:noop] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await t.sendMail({ from: config.email.from, to, subject, html });
  } catch (err) {
    // Email delivery must never fail the request that triggered it — registration,
    // password reset, and application-status updates all still need to succeed even
    // if the SMTP provider is slow/unreachable/misconfigured. Log it so it's visible
    // in Render's logs, but don't let it propagate and 500 the caller.
    console.error(`[email:failed] To: ${to} | Subject: ${subject} |`, err.message);
  }
}

function verificationEmailHtml({ companyName, verifyUrl }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
      <h2 style="color:#2563EB;">Verify ${companyName} on Silver Link</h2>
      <p>Click the link below to confirm you manage this company profile and gain access to your dashboard.</p>
      <p><a href="${verifyUrl}" style="background:#2563EB;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Verify company</a></p>
      <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    </div>`;
}

function applicationStatusHtml({ studentName, companyName, status }) {
  const statusText = {
    reviewed: 'has reviewed your application',
    accepted: 'has accepted your application 🎉',
    rejected: 'has decided not to move forward with your application',
  }[status] || 'updated your application';

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
      <h2 style="color:#2563EB;">Application update</h2>
      <p>Hi ${studentName}, <strong>${companyName}</strong> ${statusText}.</p>
      <p style="color:#6b7280;font-size:13px;">Log in to Silver Link to see details.</p>
    </div>`;
}

function passwordResetEmailHtml({ resetUrl }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
      <h2 style="color:#2563EB;">Reset your password</h2>
      <p>We got a request to reset your Silver Link password. Click below to choose a new one.</p>
      <p><a href="${resetUrl}" style="background:#2563EB;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset password</a></p>
      <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>`;
}

module.exports = {
  sendMail, verificationEmailHtml, applicationStatusHtml, passwordResetEmailHtml,
};
