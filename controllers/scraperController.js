const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Company = require('../models/Company');
const { runScraper } = require('../scraper/runner');
const { logDir } = require('../scraper/config');

const getScraperStatus = asyncHandler(async (req, res) => {
  const latest = await Company.latestScraperRun();
  const stats = await Company.getScraperStats();
  res.status(200).json({
    success: true,
    data: {
      latestRun: latest || null,
      stats,
    },
  });
});

const runScraperManually = asyncHandler(async (req, res) => {
  const logFile = path.join(logDir, `manual-${Date.now()}.log`);
  const run = await Company.createScraperRun({
    status: 'running',
    companiesFound: 0,
    companiesAdded: 0,
    companiesUpdated: 0,
    duplicatesRemoved: 0,
    errors: null,
    logFile,
  });

  try {
    const result = await runScraper({ logFile });
    await Company.updateScraperRun(run.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      companiesFound: result.discovered || 0,
      companiesAdded: result.added || 0,
      companiesUpdated: result.updated || 0,
      duplicatesRemoved: result.skipped || 0,
      errors: null,
    });

    res.status(200).json({ success: true, data: { run, result } });
  } catch (error) {
    await Company.updateScraperRun(run.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errors: error.message,
    });
    throw new ApiError(500, error.message);
  }
});

const getScraperLogs = asyncHandler(async (req, res) => {
  const latest = await Company.latestScraperRun();
  const logFile = latest?.log_file || null;
  if (!logFile || !fs.existsSync(logFile)) {
    return res.status(200).json({ success: true, data: [] });
  }
  const content = fs.readFileSync(logFile, 'utf8');
  res.status(200).json({ success: true, data: content.split('\n').filter(Boolean) });
});

module.exports = {
  getScraperStatus,
  runScraperManually,
  getScraperLogs,
};
