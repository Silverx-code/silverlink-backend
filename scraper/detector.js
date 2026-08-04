const KEYWORDS = [
  { term: 'siwes', score: 50 },
  { term: 'industrial training', score: 30 },
  { term: 'industrial attachment', score: 30 },
  { term: 'internship', score: 15 },
  { term: 'graduate programme', score: 15 },
  { term: 'undergraduate', score: 10 },
  { term: 'student', score: 5 },
  { term: 'placement', score: 10 },
  { term: 'industrial work experience', score: 20 },
];

function scoreOpportunityText(text = '') {
  const normalized = String(text || '').toLowerCase();
  return KEYWORDS.reduce((total, keyword) => {
    return normalized.includes(keyword.term) ? total + keyword.score : total;
  }, 0);
}

function classifyOpportunity(text = '') {
  const score = scoreOpportunityText(text);
  if (score >= 80) return { label: 'verified', score, confidence: 'high' };
  if (score >= 40) return { label: 'likely', score, confidence: 'medium' };
  return { label: 'ignore', score, confidence: 'low' };
}

function detectApplicationMethod(text = '') {
  const value = String(text || '').trim().toLowerCase();
  if (!value) return 'platform';
  if (value.includes('mailto:')) return 'email';
  if (value.includes('http') || value.includes('www')) return 'external';
  if (value.includes('office') || value.includes('visit')) return 'in_person';
  return 'platform';
}

module.exports = {
  scoreOpportunityText,
  classifyOpportunity,
  detectApplicationMethod,
};
