const fs = require('fs');
const path = require('path');
const { downloadPage } = require('./crawler');
const { parseHtml } = require('./parser');
const { classifyOpportunity } = require('./detector');
const { extractCompanyData } = require('./extractor');
const { deduplicateCompanies } = require('./deduplicator');
const { upsertDiscoveredCompanies } = require('./updater');
const { collectCandidateUrls } = require('./sources');
const { logDir, maxPages, crawlConcurrency } = require('./config');

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

  const scrapeUrl = async (url) => {
    try {
      const { html } = await downloadPage(url, {
        onRetry: (attempt, error) => appendLog(`Retry ${attempt} for ${url}: ${error.message}`),
      });
      const parsed = parseHtml(html, url);
      const classification = classifyOpportunity(parsed.text);
      if (classification.label === 'ignore') return;

      const record = extractCompanyData(parsed, url);
      record.confidenceScore = classification.score;
      discovered.push(record);
      appendLog(`Candidate found at ${url} (${classification.label}, ${classification.score})`);
    } catch (error) {
      appendLog(`Failed to fetch ${url}: ${error.message}`);
    }
  };

  for (let start = 0; start < pagesToVisit.length; start += crawlConcurrency) {
    const batch = pagesToVisit.slice(start, start + crawlConcurrency);
    await Promise.all(batch.map(scrapeUrl));
  }

  const unique = deduplicateCompanies(discovered);
  appendLog(`Deduplicated to ${unique.length} candidate companies`);
  const result = await upsertDiscoveredCompanies(unique);
  appendLog(`Added ${result.added}, updated ${result.updated}, skipped ${result.skipped}`);
  appendLog('Scraper run complete');
  return { discovered: unique.length, ...result };
}

module.exports = { runScraper };
