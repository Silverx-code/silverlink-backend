const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { collectCandidateUrls } = require('../sources');

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'silverlink-scraper-'));
  const datasetPath = path.join(tmpDir, 'dataset.json');
  fs.writeFileSync(datasetPath, JSON.stringify([
    { url: 'https://fixture.test/careers' },
    { url: 'https://fixture.test/jobs' },
  ]));

  process.env.SCRAPER_DATASET_FILE = datasetPath;
  const urls = await collectCandidateUrls();
  assert.ok(urls.includes('https://fixture.test/careers'));
  assert.ok(urls.includes('https://fixture.test/jobs'));

  console.log('sources tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
