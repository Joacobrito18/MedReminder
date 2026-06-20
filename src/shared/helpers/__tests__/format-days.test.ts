import { formatDays } from '@/shared/helpers/format-days';

describe('formatDays', () => {
  it('devuelve "Sin días" cuando no hay días', () => {
    expect(formatDays([])).toBe('Sin días');
  });

  it('reconoce todos los días', () => {
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Todos los días');
  });

  it('reconoce lunes a viernes', () => {
    expect(formatDays([1, 2, 3, 4, 5])).toBe('Lunes a viernes');
  });

  it('reconoce el fin de semana', () => {
    expect(formatDays([0, 6])).toBe('Sábados y domingos');
  });

  it('lista los días en orden de la semana empezando por lunes', () => {
    expect(formatDays([0, 1, 3])).toBe('Lun, Mié, Dom');
  });
});
