const assert = require('assert');
const { scoreOpportunityText, detectApplicationMethod } = require('../detector');

function run() {
  const score = scoreOpportunityText('SIWES Industrial Training internship for students');
  assert.ok(score >= 80, `expected high score, got ${score}`);

  const method = detectApplicationMethod('mailto:careers@example.com');
  assert.strictEqual(method, 'email');

  console.log('detector tests passed');
}

run();
