const ApiError = require('../utils/ApiError');
const { verifyChallenge } = require('../utils/captcha');

// Expects { captchaToken, captchaAnswer } in the request body, issued by
// GET /api/auth/captcha. Runs after honeypot so a tripped honeypot short-circuits first.
function verifyCaptcha(req, res, next) {
  const { captchaToken, captchaAnswer } = req.body;
  if (!verifyChallenge(captchaToken, captchaAnswer)) {
    throw new ApiError(400, 'Captcha verification failed. Please try again.');
  }
  next();
}

module.exports = verifyCaptcha;
