const crypto = require('crypto');
const config = require('../config');

// A lightweight, self-hosted alternative to a third-party CAPTCHA provider.
// The challenge (two numbers + expiry) is signed with HMAC and handed to the client;
// we verify it statelessly on submit rather than storing anything server-side.
// This stops naive/scripted bots; it will not stop a targeted human-solved attack —
// swap in Cloudflare Turnstile or hCaptcha here if abuse becomes a real problem.

function sign(payload) {
  return crypto.createHmac('sha256', config.jwtSecret).update(payload).digest('hex');
}

function generateChallenge() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes to solve
  const payload = `${a}.${b}.${expires}`;
  const signature = sign(payload);
  const token = Buffer.from(`${payload}.${signature}`).toString('base64url');

  return { token, question: `What is ${a} + ${b}?` };
}

function verifyChallenge(token, answer) {
  if (!token || answer === undefined || answer === null) {
    console.log('[captcha] rejected: missing token or answer');
    return false;
  }
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [a, b, expires, signature] = decoded.split('.');
    const payload = `${a}.${b}.${expires}`;
    const expectedSignature = sign(payload);

    if (signature !== expectedSignature) {
      console.log('[captcha] rejected: signature mismatch — token may be stale from before a JWT_SECRET change/redeploy');
      return false;
    }
    if (Date.now() > Number(expires)) {
      console.log(`[captcha] rejected: expired ${Math.round((Date.now() - Number(expires)) / 1000)}s ago`);
      return false;
    }

    const expected = Number(a) + Number(b);
    const isCorrect = Number(answer) === expected;
    if (!isCorrect) {
      console.log(`[captcha] rejected: wrong answer — expected ${expected}, got ${answer}`);
    }
    return isCorrect;
  } catch (err) {
    console.log('[captcha] rejected: could not decode token —', err.message);
    return false;
  }
}

module.exports = { generateChallenge, verifyChallenge };
