const SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const includesAll = (days: number[], required: number[]): boolean =>
  required.every((d) => days.includes(d));

export const formatDays = (days: number[]): string => {
  if (days.length === 0) return 'Sin días';
  if (days.length === 7) return 'Todos los días';
  if (days.length === 5 && includesAll(days, [1, 2, 3, 4, 5])) return 'Lunes a viernes';
  if (days.length === 2 && includesAll(days, [0, 6])) return 'Sábados y domingos';
  return DISPLAY_ORDER.filter((d) => days.includes(d))
    .map((d) => SHORT[d])
    .join(', ');
};
