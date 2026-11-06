import type { Match, Stage } from '../types';
import { uid } from './id';

/**
 * Genera un calendario todos contra todos con el método del círculo.
 * Si hay número impar de equipos, cada jornada uno descansa.
 */
export function roundRobin(
  teamIds: string[],
  opts: { doubleRound?: boolean; stage?: Stage; group?: string } = {},
): Match[] {
  const stage = opts.stage ?? 'liga';
  const ids: (string | null)[] = [...teamIds];
  if (ids.length < 2) return [];
  if (ids.length % 2 === 1) ids.push(null); // descanso

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;
  const matches: Match[] = [];
  let rotation = [...ids];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      if (a === null || b === null) continue;
      // Alternar localía para equilibrar
      const [home, away] = (r + i) % 2 === 0 ? [a, b] : [b, a];
      matches.push(makeMatch(stage, r, home, away, opts.group));
    }
    // Rotar todos menos el primero
    rotation = [rotation[0], rotation[n - 1], ...rotation.slice(1, n - 1)];
  }

  if (opts.doubleRound) {
    const second = matches.map((m) => makeMatch(stage, m.round + rounds, m.awayId!, m.homeId!, opts.group));
    matches.push(...second);
  }
  return matches;
}

function makeMatch(stage: Stage, round: number, homeId: string, awayId: string, group?: string): Match {
  return { id: uid(), stage, round, group, homeId, awayId, homeGoals: null, awayGoals: null };
}

/** Reparte equipos en grupos (A, B, C...) de forma balanceada. */
export function splitIntoGroups(teamIds: string[], groupsCount: number): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  const letters = Array.from({ length: groupsCount }, (_, i) => String.fromCharCode(65 + i));
  letters.forEach((l) => (groups[l] = []));
  teamIds.forEach((id, i) => groups[letters[i % groupsCount]].push(id));
  return groups;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
