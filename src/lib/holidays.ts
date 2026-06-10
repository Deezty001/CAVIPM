// NSW Public Holidays — updated through 2027
// Sources: NSW Government official calendar

type Holiday = { date: string; name: string }; // YYYY-MM-DD

const NSW_HOLIDAYS: Holiday[] = [
  // 2024
  { date: "2024-01-01", name: "New Year's Day" },
  { date: "2024-01-26", name: "Australia Day" },
  { date: "2024-03-29", name: "Good Friday" },
  { date: "2024-03-30", name: "Easter Saturday" },
  { date: "2024-03-31", name: "Easter Sunday" },
  { date: "2024-04-01", name: "Easter Monday" },
  { date: "2024-04-25", name: "Anzac Day" },
  { date: "2024-06-10", name: "King's Birthday" },
  { date: "2024-08-05", name: "Bank Holiday" },
  { date: "2024-10-07", name: "Labour Day" },
  { date: "2024-12-25", name: "Christmas Day" },
  { date: "2024-12-26", name: "Boxing Day" },

  // 2025
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-01-27", name: "Australia Day (substitute)" },
  { date: "2025-04-18", name: "Good Friday" },
  { date: "2025-04-19", name: "Easter Saturday" },
  { date: "2025-04-20", name: "Easter Sunday" },
  { date: "2025-04-21", name: "Easter Monday" },
  { date: "2025-04-25", name: "Anzac Day" },
  { date: "2025-06-09", name: "King's Birthday" },
  { date: "2025-08-04", name: "Bank Holiday" },
  { date: "2025-10-06", name: "Labour Day" },
  { date: "2025-12-25", name: "Christmas Day" },
  { date: "2025-12-26", name: "Boxing Day" },

  // 2026
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-26", name: "Australia Day" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-04", name: "Easter Saturday" },
  { date: "2026-04-05", name: "Easter Sunday" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-04-25", name: "Anzac Day (substitute, 27 Apr)" },
  { date: "2026-06-08", name: "King's Birthday" },
  { date: "2026-08-03", name: "Bank Holiday" },
  { date: "2026-10-05", name: "Labour Day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-28", name: "Boxing Day (substitute)" },

  // 2027
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-01-26", name: "Australia Day" },
  { date: "2027-03-26", name: "Good Friday" },
  { date: "2027-03-27", name: "Easter Saturday" },
  { date: "2027-03-28", name: "Easter Sunday" },
  { date: "2027-03-29", name: "Easter Monday" },
  { date: "2027-04-26", name: "Anzac Day (substitute)" },
  { date: "2027-06-14", name: "King's Birthday" },
  { date: "2027-08-02", name: "Bank Holiday" },
  { date: "2027-10-04", name: "Labour Day" },
  { date: "2027-12-27", name: "Christmas Day (substitute)" },
  { date: "2027-12-28", name: "Boxing Day (substitute)" },
];

const holidaySet = new Set(NSW_HOLIDAYS.map((h) => h.date));
const holidayMap = new Map(NSW_HOLIDAYS.map((h) => [h.date, h.name]));

export function isNSWPublicHoliday(date: Date): boolean {
  const key = formatDateKey(date);
  return holidaySet.has(key);
}

export function getHolidayName(date: Date): string | undefined {
  return holidayMap.get(formatDateKey(date));
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !isNSWPublicHoliday(date);
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
