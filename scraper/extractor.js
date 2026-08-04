const { detectApplicationMethod } = require('./detector');

function extractCompanyData(parsedPage, sourceUrl) {
  const title = parsedPage.title || '';
  const text = parsedPage.text || '';
  const firstLink = (parsedPage.links || [])[0] || '';
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/\+?234\d{10}|\+?\d{10,13}/);

  return {
    name: title.split('|')[0].trim() || 'Discovered Company',
    website: firstLink || sourceUrl,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    opportunityTitle: title,
    description: text.slice(0, 500),
    applicationMethod: detectApplicationMethod(firstLink || ''),
    applicationUrl: firstLink || null,
    source: 'scraper',
    sourcePage: sourceUrl,
    confidenceScore: 60,
  };
}

module.exports = { extractCompanyData };