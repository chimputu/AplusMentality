export function formatDate(input: Date | string | number): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateTime(input: Date | string | number): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d);
}