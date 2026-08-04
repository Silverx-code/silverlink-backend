const Company = require('../models/Company');

async function upsertDiscoveredCompanies(records) {
  const results = { added: 0, updated: 0, skipped: 0 };

  for (const record of records) {
    const existing = await Company.findByWebsite(record.website || '');
    if (existing) {
      await Company.updateFromScraper(existing.id, {
        description: record.description,
        website: record.website,
        apply_method: record.applicationMethod,
        apply_url: record.applicationUrl,
        source: 'scraper',
        source_page: record.sourcePage,
        confidence_score: record.confidenceScore,
        last_scraped: new Date().toISOString(),
        last_seen_online: new Date().toISOString(),
        is_verified: false,
      });
      results.updated += 1;
      continue;
    }

    await Company.createFromScraper({
      name: record.name,
      description: record.description,
      website: record.website,
      apply_method: record.applicationMethod,
      apply_url: record.applicationUrl,
      source: 'scraper',
      source_page: record.sourcePage,
      confidence_score: record.confidenceScore,
      last_scraped: new Date().toISOString(),
      last_seen_online: new Date().toISOString(),
      is_verified: false,
    });
    results.added += 1;
  }

  return results;
}

module.exports = { upsertDiscoveredCompanies };