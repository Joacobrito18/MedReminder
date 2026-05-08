export const formatTime = (date: Date): string => {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

export const parseTime = (time: string): { hour: number; minute: number } => {
  const [hourStr, minuteStr] = time.split(':');
  return { hour: Number(hourStr), minute: Number(minuteStr) };
};

export const timeToDate = (time: string): Date => {
  const { hour, minute } = parseTime(time);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};
