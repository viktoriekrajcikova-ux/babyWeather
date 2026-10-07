export function formatHour(dt: number, timezone: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(dt * 1000));
}
