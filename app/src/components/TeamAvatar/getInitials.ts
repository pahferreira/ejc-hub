const CONNECTOR_WORDS = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'aos', 'e/ou'])

export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)

  const meaningfulWords = words.filter((word) => !CONNECTOR_WORDS.has(word.toLowerCase()))

  // Fall back to the raw words if the name is made up entirely of connectors.
  const relevantWords = meaningfulWords.length > 0 ? meaningfulWords : words

  // Single meaningful word -> first two letters (e.g. "Som" -> "SO").
  if (relevantWords.length === 1) {
    return relevantWords[0].slice(0, 2).toUpperCase()
  }

  // Multiple words -> first letter of each of the first two (e.g. "Som e Iluminação" -> "SI").
  return (relevantWords[0].charAt(0) + relevantWords[1].charAt(0)).toUpperCase()
}
