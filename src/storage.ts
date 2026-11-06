import type { Tournament } from './types';

const KEY = 'apptorneo.tournaments.v1';

export function loadTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tournament[]) : [];
  } catch {
    return [];
  }
}

export function saveTournaments(list: Tournament[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // almacenamiento no disponible (modo privado, etc.)
  }
}

export function downloadJson(t: Tournament): void {
  const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${t.name.replace(/[^\w-]+/g, '_') || 'torneo'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function isTournament(x: unknown): x is Tournament {
  const t = x as Tournament;
  return !!t && typeof t.id === 'string' && typeof t.name === 'string' && Array.isArray(t.teams) && Array.isArray(t.matches);
}
