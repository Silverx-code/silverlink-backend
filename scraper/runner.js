const fs = require('fs');
const path = require('path');
const { downloadPage } = require('./crawler');
const { parseHtml } = require('./parser');
const { classifyOpportunity } = require('./detector');
const { extractCompanyData } = require('./extractor');
const { deduplicateCompanies } = require('./deduplicator');
const { upsertDiscoveredCompanies } = require('./updater');
const { collectCandidateUrls } = require('./sources');
const { logDir, maxPages } = require('./config');

fs.mkdirSync(logDir, { recursive: true });

async function runScraper(options = {}) {
  const logFile = options.logFile || path.join(logDir, `scrape-${Date.now()}.log`);
  const appendLog = (line) => {
    console.log(line);
    fs.appendFileSync(logFile, `${line}\n`, 'utf8');
  };

  appendLog('Starting scraper run');
  const urls = await collectCandidateUrls();
  appendLog(`Collected ${urls.length} candidate URLs from configured sources`);

  const discovered = [];
  const pagesToVisit = urls.slice(0, maxPages);

  for (const url of pagesToVisit) {
    try {
      const { html } = await downloadPage(url);
      const parsed = parseHtml(html, url);
      const classification = classifyOpportunity(parsed.text);
      if (classification.label === 'ignore') continue;

      const record = extractCompanyData(parsed, url);
      record.confidenceScore = classification.score;
      discovered.push(record);
      appendLog(`Candidate found at ${url} (${classification.label}, ${classification.score})`);
    } catch (error) {
      appendLog(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  const unique = deduplicateCompanies(discovered);
  appendLog(`Deduplicated to ${unique.length} candidate companies`);
  const result = await upsertDiscoveredCompanies(unique);
  appendLog(`Added ${result.added}, updated ${result.updated}, skipped ${result.skipped}`);
  appendLog('Scraper run complete');
  return { discovered: unique.length, ...result };
}

module.exports = { runScraper };