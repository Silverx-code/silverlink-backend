const DeviceToken = require('../models/DeviceToken');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Sends a push to every device registered for this user. Expo's push API accepts
// batches of up to 100 messages per request; we're nowhere near that volume per call
// so a single request per notify is fine.
async function sendPush(userId, title, body) {
  try {
    const tokens = await DeviceToken.listForUser(userId);
    if (tokens.length === 0) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.error('[push] Expo push API returned', res.status);
      return;
    }

    const data = await res.json();
    // Expo flags tokens that are no longer valid (app uninstalled, etc.) — clean those up
    // so future notifications don't keep trying a dead token.
    (data.data || []).forEach((result, i) => {
      if (result.status === 'error' && result.details?.error === 'DeviceNotRegistered') {
        DeviceToken.removeByToken(tokens[i].token).catch(() => {});
      }
    });
  } catch (err) {
    // Push failures should never break the request that triggered them
    console.error('[push] Failed to send push notification:', err.message);
  }
}

module.exports = { sendPush };
