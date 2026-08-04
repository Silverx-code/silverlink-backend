const cheerio = require('cheerio');

function parseHtml(html, url) {
  const $ = cheerio.load(html || '');
  const text = $.text().replace(/\s+/g, ' ').trim();
  const title = $('title').first().text().trim() || '';
  const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get();
  const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const links = $('a').map((_, el) => $(el).attr('href')).get().filter(Boolean);

  return {
    url,
    title,
    headings,
    paragraphs,
    links,
    text,
  };
}

module.exports = { parseHtml };