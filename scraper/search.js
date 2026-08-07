const { searchQueries, maxUrlsPerQuery } = require('./config');
const { URL } = require('url');

function buildSearchUrls(baseUrl) {
  if (!baseUrl) return [];
  const urls = new Set();
  const origin = new URL(baseUrl).origin;

  searchQueries.forEach((query) => {
    const encoded = encodeURIComponent(query);
    urls.add(`${origin}/search?q=${encoded}`);
    urls.add(`${origin}/careers?q=${encoded}`);
    urls.add(`${origin}/jobs?q=${encoded}`);
  });

  return Array.from(urls).slice(0, maxUrlsPerQuery);
}

module.exports = { buildSearchUrls };
