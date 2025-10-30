export function getLocalDayRange(date: Date = new Date()) {
  // Compute local day start/end and return ISO strings (UTC) matching the local boundaries
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    dateStr: new Date(start.getTime() - start.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10),
  };
}
