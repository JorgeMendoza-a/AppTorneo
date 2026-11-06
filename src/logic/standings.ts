import type { Match, Settings, StandingRow } from '../types';

export function isPlayed(m: Match): boolean {
  return m.homeGoals !== null && m.awayGoals !== null;
}

/**
 * Calcula la tabla de posiciones.
 * Criterios de desempate: puntos, diferencia de gol, goles a favor,
 * enfrentamiento directo (puntos entre ellos) y finalmente nombre.
 */
export function computeStandings(
  teamIds: string[],
  matches: Match[],
  settings: Pick<Settings, 'pointsWin' | 'pointsDraw'>,
  nameOf: (id: string) => string = (id) => id,
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const id of teamIds) {
    rows.set(id, { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 });
  }

  const played = matches.filter((m) => isPlayed(m) && m.homeId && m.awayId && rows.has(m.homeId) && rows.has(m.awayId));

  for (const m of played) {
    const h = rows.get(m.homeId!)!;
    const a = rows.get(m.awayId!)!;
    const hg = m.homeGoals!;
    const ag = m.awayGoals!;
    h.played++; a.played++;
    h.goalsFor += hg; h.goalsAgainst += ag;
    a.goalsFor += ag; a.goalsAgainst += hg;
    if (hg > ag) { h.won++; a.lost++; h.points += settings.pointsWin; }
    else if (hg < ag) { a.won++; h.lost++; a.points += settings.pointsWin; }
    else { h.drawn++; a.drawn++; h.points += settings.pointsDraw; a.points += settings.pointsDraw; }
  }
  for (const r of rows.values()) r.goalDiff = r.goalsFor - r.goalsAgainst;

  const headToHead = (x: string, y: string): number => {
    let px = 0, py = 0;
    for (const m of played) {
      const pair = (m.homeId === x && m.awayId === y) || (m.homeId === y && m.awayId === x);
      if (!pair) continue;
      const xg = m.homeId === x ? m.homeGoals! : m.awayGoals!;
      const yg = m.homeId === x ? m.awayGoals! : m.homeGoals!;
      if (xg > yg) px += settings.pointsWin;
      else if (xg < yg) py += settings.pointsWin;
      else { px += settings.pointsDraw; py += settings.pointsDraw; }
    }
    return py - px;
  };

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      headToHead(a.teamId, b.teamId) ||
      nameOf(a.teamId).localeCompare(nameOf(b.teamId)),
  );
}
