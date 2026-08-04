function deduplicateCompanies(records) {
  const seen = new Map();
  for (const record of records) {
    const key = [record.name, record.website, record.email, record.phone]
      .filter(Boolean)
      .join('|');

    if (!seen.has(key)) {
      seen.set(key, record);
    }
  }
  return Array.from(seen.values());
}

module.exports = { deduplicateCompanies };