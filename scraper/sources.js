const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { maxUrlsPerQuery } = require('./config');

async function loadDatasetUrls() {
  const datasetFile = process.env.SCRAPER_DATASET_FILE || '';
  if (!datasetFile) return [];
  if (!fs.existsSync(datasetFile)) return [];

  try {
    const raw = fs.readFileSync(datasetFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === 'string' ? item : item.url))
        .filter(Boolean);
    }
  } catch (error) {
    console.warn(`Unable to read scraper dataset file: ${error.message}`);
  }
  return [];
}

async function collectCandidateUrls(options = {}) {
  const urls = new Set();

  const datasetUrls = await loadDatasetUrls();
  datasetUrls.forEach((item) => urls.add(item));

  if (process.env.SCRAPER_SEARCH_API_URL) {
    try {
      const response = await fetch(process.env.SCRAPER_SEARCH_API_URL);
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : payload.results || [];
      items.forEach((item) => {
        const value = typeof item === 'string' ? item : item.url || item.link;
        if (value) urls.add(value);
      });
    } catch (error) {
      console.warn(`Search API source failed: ${error.message}`);
    }
  }

  if (process.env.SCRAPER_COMPANY_SITES) {
    process.env.SCRAPER_COMPANY_SITES.split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((site) => {
        const normalized = site.startsWith('http') ? site : `https://${site}`;
        urls.add(normalized);
        urls.add(`${normalized}/careers`);
        urls.add(`${normalized}/jobs`);
        urls.add(`${normalized}/internship`);
      });
  }

  return Array.from(urls).slice(0, maxUrlsPerQuery * 3);
}

module.exports = { collectCandidateUrls };
