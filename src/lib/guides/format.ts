export function formatGuideDate(isoDate: string): string {
  if (!isoDate) return ""

  // "YYYY-MM-DD" is parsed as UTC midnight, shifting the shown day in
  // negative UTC offsets (e.g. Brazil). Parse date-only strings as local time.
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? `${isoDate}T00:00:00` : isoDate
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return isoDate

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}