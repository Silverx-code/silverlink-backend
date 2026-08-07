const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const axios = require('axios');
const { rawHtmlDir, crawlTimeoutMs, crawlRetries } = require('./config');

fs.mkdirSync(rawHtmlDir, { recursive: true });

const shouldRetry = (error) => {
  if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') return true;
  const status = error.response?.status;
  return status === 408 || status === 429 || (status >= 500 && status < 600);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadPage(url, { onRetry } = {}) {
  let response;
  let lastError;

  for (let attempt = 0; attempt <= crawlRetries; attempt += 1) {
    try {
      response = await axios.get(url, {
        timeout: crawlTimeoutMs,
        maxRedirects: 3,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SilverLinkOpportunityBot/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === crawlRetries || !shouldRetry(error)) throw error;
      onRetry?.(attempt + 1, error);
      await delay(750 * (attempt + 1));
    }
  }

  if (!response) throw lastError;

  const safeName = encodeURIComponent(new URL(url).hostname + '-' + new URL(url).pathname.replace(/\//g, '_'));
  const filePath = path.join(rawHtmlDir, `${safeName}.html`);
  fs.writeFileSync(filePath, response.data, 'utf8');

  return { html: response.data, filePath };
}

module.exports = { downloadPage };
