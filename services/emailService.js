const config = require('../config');

const RESEND_API_URL = 'https://api.resend.com/emails';

// Resend's HTTP API instead of SMTP — Render blocks outbound SMTP ports (25/465/587)
// on free web services as an anti-abuse measure, which is what caused the
// ETIMEDOUT/connection-timeout failures seen in production. This is a plain HTTPS
// POST request, which isn't affected by that block at all. If you switch providers
// later, only this function needs to change — the rest of the app just calls sendMail().
async function sendMail({ to, subject, html }) {
  if (!config.email.resendApiKey) {
    // No provider configured — log instead of failing the request
    console.log(`[email:noop] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.email.from,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend API returned ${res.status}: ${body}`);
    }
  } catch (err) {
    // Email delivery must never fail the request that triggered it — registration,
    // password reset, and application-status updates all still need to succeed even
    // if Resend is slow/unreachable/misconfigured. Log it so it's visible in Render's
    // logs, but don't let it propagate and 500 the caller.
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
