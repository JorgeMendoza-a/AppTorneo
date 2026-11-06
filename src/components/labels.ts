import type { Format, Mode } from '../types';

export const MODE_LABEL: Record<Mode, string> = { real: 'Fútbol real', fifa: 'FIFA / videojuego' };
export const FORMAT_LABEL: Record<Format, string> = {
  liga: 'Liga (todos contra todos)',
  eliminatoria: 'Eliminación directa',
  grupos: 'Grupos + eliminatoria',
};
