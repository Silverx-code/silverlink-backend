module.exports = {
  searchQueries: [
    'SIWES Nigeria',
    'Industrial Training Nigeria',
    'Industrial Attachment Nigeria',
    'Student Internship Nigeria',
    'Graduate Programme Nigeria',
  ],
  maxUrlsPerQuery: 20,
  crawlTimeoutMs: 10000,
  maxPages: 40,
  minConfidence: 40,
  logDir: require('path').join(__dirname, 'logs'),
  rawHtmlDir: require('path').join(__dirname, 'raw_html'),
  sources: {
    datasetFile: process.env.SCRAPER_DATASET_FILE || '',
    searchApiUrl: process.env.SCRAPER_SEARCH_API_URL || '',
    companySites: process.env.SCRAPER_COMPANY_SITES || '',
  },
};
