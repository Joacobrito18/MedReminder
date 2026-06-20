import { render, screen } from '@testing-library/react-native';

import DayBanner from '@/modules/medications/components/DayBanner';

describe('<DayBanner />', () => {
  it('muestra el progreso y los pendientes del día', () => {
    render(<DayBanner taken={2} total={3} />);
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getByText('Quedan 1 de hoy')).toBeTruthy();
  });

  it('muestra "Día completo" cuando se tomaron todas', () => {
    render(<DayBanner taken={3} total={3} />);
    expect(screen.getByText('Día completo')).toBeTruthy();
  });

  it('muestra el estado vacío cuando no hay medicaciones', () => {
    render(<DayBanner taken={0} total={0} />);
    expect(screen.getByText('Sin medicaciones hoy')).toBeTruthy();
  });
});
