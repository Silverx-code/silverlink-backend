const cron = require('node-cron');
const { runScraper } = require('./runner');

function startScheduler() {
  if (process.env.SCRAPER_SCHEDULE !== 'true') return null;

  return cron.schedule('0 2 * * *', async () => {
    try {
      await runScraper();
    } catch (error) {
      console.error('Scheduled scraper run failed:', error.message);
    }
  });
}

module.exports = { startScheduler };