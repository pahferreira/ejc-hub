// Trims text and turns blank input into null. undefined stays undefined (leave
// untouched) and null stays null (clear).
export const normalizeOptionalText = (value: string | null | undefined) => {
  if (value === undefined || value === null) return value
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
