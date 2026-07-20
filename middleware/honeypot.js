// Registration forms include a hidden `website` field that real users never fill in.
// Bots that auto-fill every field trip this and get a generic success-shaped rejection
// (not a 4xx that teaches them what tripped it) — cheap, no external CAPTCHA dependency.
function honeypot(req, res, next) {
  if (req.body && req.body.website) {
    return res.status(200).json({ success: true, message: 'Request received.' });
  }
  return next();
}

module.exports = honeypot;
