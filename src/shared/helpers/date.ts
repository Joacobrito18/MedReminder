export const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const wasTakenToday = (lastTakenAt: string | undefined): boolean => {
  if (!lastTakenAt) return false;
  const taken = new Date(lastTakenAt);
  if (Number.isNaN(taken.getTime())) return false;
  return isSameLocalDay(taken, new Date());
};

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const formatLongDate = (d: Date = new Date()): string => {
  const weekday = WEEKDAYS[d.getDay()];
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  return `${weekday}, ${day} de ${month}`;
};
