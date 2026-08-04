const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const axios = require('axios');
const { rawHtmlDir, crawlTimeoutMs } = require('./config');

fs.mkdirSync(rawHtmlDir, { recursive: true });

async function downloadPage(url) {
  const response = await axios.get(url, {
    timeout: crawlTimeoutMs,
    maxRedirects: 3,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  const safeName = encodeURIComponent(new URL(url).hostname + '-' + new URL(url).pathname.replace(/\//g, '_'));
  const filePath = path.join(rawHtmlDir, `${safeName}.html`);
  fs.writeFileSync(filePath, response.data, 'utf8');

  return { html: response.data, filePath };
}

module.exports = { downloadPage };