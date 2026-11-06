import type { Match, Tournament } from '../types';
import { roundRobin, shuffle, splitIntoGroups } from './fixtures';
import { buildBracket, champion, propagate } from './knockout';
import { computeStandings, isPlayed } from './standings';

export function teamName(t: Tournament, id: string | null): string {
  if (!id) return '—';
  const team = t.teams.find((x) => x.id === id);
  return team ? team.name : '¿?';
}

export function teamLabel(t: Tournament, id: string | null): string {
  if (!id) return '—';
  const team = t.teams.find((x) => x.id === id);
  if (!team) return '¿?';
  return t.mode === 'fifa' && team.club ? `${team.name} (${team.club})` : team.name;
}

export function hasStarted(t: Tournament): boolean {
  return t.matches.length > 0;
}

/** Genera el calendario inicial según el formato. */
export function startTournament(t: Tournament, randomize = true): Tournament {
  const ids = randomize ? shuffle(t.teams.map((x) => x.id)) : t.teams.map((x) => x.id);
  let matches: Match[] = [];
  if (t.format === 'liga') {
    matches = roundRobin(ids, { doubleRound: t.settings.doubleRound });
  } else if (t.format === 'eliminatoria') {
    matches = buildBracket(ids);
  } else {
    const groups = splitIntoGroups(ids, t.settings.groupsCount);
    for (const [letter, members] of Object.entries(groups)) {
      matches.push(...roundRobin(members, { doubleRound: t.settings.doubleRound, stage: 'grupo', group: letter }));
    }
  }
  return { ...t, matches };
}

export function groupLetters(t: Tournament): string[] {
  return [...new Set(t.matches.filter((m) => m.stage === 'grupo').map((m) => m.group!))].sort();
}

export function groupMembers(t: Tournament, letter: string): string[] {
  const ids = new Set<string>();
  for (const m of t.matches) {
    if (m.stage === 'grupo' && m.group === letter) {
      if (m.homeId) ids.add(m.homeId);
      if (m.awayId) ids.add(m.awayId);
    }
  }
  return [...ids];
}

export function groupStageComplete(t: Tournament): boolean {
  const g = t.matches.filter((m) => m.stage === 'grupo');
  return g.length > 0 && g.every(isPlayed);
}

export function hasKnockout(t: Tournament): boolean {
  return t.matches.some((m) => m.stage === 'ko');
}

/**
 * Clasifica a los mejores de cada grupo y arma la fase final.
 * Siembra: primero todos los 1°, luego los 2°, etc. Así los líderes de grupo
 * no se cruzan entre sí en la primera ronda.
 */
export function buildKnockoutFromGroups(t: Tournament): Tournament {
  const q = t.settings.qualifiersPerGroup;
  const byPosition: string[][] = Array.from({ length: q }, () => []);
  for (const letter of groupLetters(t)) {
    const groupMatches = t.matches.filter((m) => m.stage === 'grupo' && m.group === letter);
    const table = computeStandings(groupMembers(t, letter), groupMatches, t.settings, (id) => teamName(t, id));
    table.slice(0, q).forEach((row, pos) => byPosition[pos].push(row.teamId));
  }
  const seeds = byPosition.flat();
  return { ...t, matches: [...t.matches.filter((m) => m.stage !== 'ko'), ...buildBracket(seeds)] };
}

export function updateMatch(t: Tournament, matchId: string, patch: Partial<Match>): Tournament {
  const matches = t.matches.map((m) => (m.id === matchId ? { ...m, ...patch } : m));
  return { ...t, matches: propagate(matches) };
}

export function winnerOf(t: Tournament): string | null {
  if (t.format === 'liga') {
    if (t.matches.length === 0 || !t.matches.every(isPlayed)) return null;
    return computeStandings(t.teams.map((x) => x.id), t.matches, t.settings, (id) => teamName(t, id))[0]?.teamId ?? null;
  }
  return champion(t.matches);
}

export function progress(t: Tournament): { played: number; total: number } {
  const real = t.matches.filter((m) => m.homeId && m.awayId);
  return { played: real.filter(isPlayed).length, total: real.length };
}
