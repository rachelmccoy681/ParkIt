export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs !== 1 ? 's' : ''}`;
  return `${hrs} hr${hrs !== 1 ? 's' : ''} ${mins} min`;
}

export function formatDurationShort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function buildStartOptions(): { label: string; iso: string }[] {
  const now = new Date();
  const options: { label: string; iso: string }[] = [];
  const dayLabels = ['Today', 'Tomorrow', '+2 Days'];
  for (let d = 0; d < 3 && options.length < 12; d++) {
    for (let h = 8; h <= 20 && options.length < 12; h++) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + d);
      dt.setHours(h, 0, 0, 0);
      if (dt > now) {
        options.push({
          label: `${dayLabels[d]} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          iso: dt.toISOString(),
        });
      }
    }
  }
  return options;
}
