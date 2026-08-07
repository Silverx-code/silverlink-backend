const path = require('path');

module.exports = {
  searchQueries: [
    'SIWES Nigeria',
    'Industrial Training Nigeria',
    'Industrial Attachment Nigeria',
    'Student Internship Nigeria',
    'Graduate Programme Nigeria',
  ],
  maxUrlsPerQuery: 20,
  crawlTimeoutMs: Number(process.env.SCRAPER_CRAWL_TIMEOUT_MS) || 15000,
  crawlRetries: Number(process.env.SCRAPER_CRAWL_RETRIES) || 1,
  crawlConcurrency: Number(process.env.SCRAPER_CRAWL_CONCURRENCY) || 4,
  // The bundled dataset contains 60 vetted career pages. Keep the default aligned
  // with it so a normal run does not silently discard the last 20 sources.
  maxPages: Number(process.env.SCRAPER_MAX_PAGES) || 60,
  minConfidence: 40,
  logDir: path.join(__dirname, 'logs'),
  rawHtmlDir: path.join(__dirname, 'raw_html'),
  sources: {
    datasetFile: process.env.SCRAPER_DATASET_FILE || path.join(__dirname, 'dataset.json'),
    searchApiUrl: process.env.SCRAPER_SEARCH_API_URL || '',
    companySites: process.env.SCRAPER_COMPANY_SITES || '',
  },
};
