export function parsePipeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(String).map(item => item.trim()).filter(Boolean);

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed.map(String).map(item => item.trim()).filter(Boolean);
      if (typeof parsed === 'string') return [parsed.trim()].filter(Boolean);
    } catch {
      return data.split('|').map(item => item.trim()).filter(Boolean);
    }

    return data.split('|').map(item => item.trim()).filter(Boolean);
  }

  return [];
}

export function getPrimarySuggestedDocumentType(document) {
  const suggestedTypes = parsePipeList(document?.suggestedDocumentTypes || document?.SuggestedDocumentTypes);
  return suggestedTypes[0]
    || document?.eFilingDocType
    || document?.EFilingDocType
    || document?.documentTitle
    || document?.DocumentTitle
    || 'Unknown';
}
