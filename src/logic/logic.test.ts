import { describe, expect, it } from 'vitest';
import { roundRobin, splitIntoGroups } from './fixtures';
import { buildBracket, koWinner, seedOrder } from './knockout';
import { computeStandings } from './standings';
import { buildKnockoutFromGroups, startTournament, updateMatch, winnerOf } from './tournament';
import type { Tournament } from '../types';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`);

describe('roundRobin', () => {
  it.each([4, 5, 6, 7])('con %i equipos todos juegan contra todos una vez', (n) => {
    const ms = roundRobin(ids(n));
    expect(ms).toHaveLength((n * (n - 1)) / 2);
    const pairs = new Set(ms.map((m) => [m.homeId, m.awayId].sort().join('-')));
    expect(pairs.size).toBe(ms.length);
    // nadie juega dos veces en la misma jornada
    for (let r = 0; r <= Math.max(...ms.map((m) => m.round)); r++) {
      const inRound = ms.filter((m) => m.round === r).flatMap((m) => [m.homeId, m.awayId]);
      expect(new Set(inRound).size).toBe(inRound.length);
    }
  });

  it('ida y vuelta duplica los partidos con localía invertida', () => {
    const ms = roundRobin(ids(4), { doubleRound: true });
    expect(ms).toHaveLength(12);
    expect(ms[6].homeId).toBe(ms[0].awayId);
  });
});

describe('splitIntoGroups', () => {
  it('reparte equilibradamente', () => {
    const g = splitIntoGroups(ids(10), 3);
    expect(Object.values(g).map((x) => x.length)).toEqual([4, 3, 3]);
  });
});

describe('computeStandings', () => {
  it('ordena por puntos, diferencia y goles', () => {
    const ms = roundRobin(['a', 'b', 'c']);
    const set = (h: string, a: string, hg: number, ag: number) => {
      const m = ms.find((x) => (x.homeId === h && x.awayId === a) || (x.homeId === a && x.awayId === h))!;
      if (m.homeId === h) { m.homeGoals = hg; m.awayGoals = ag; } else { m.homeGoals = ag; m.awayGoals = hg; }
    };
    set('a', 'b', 2, 0);
    set('b', 'c', 1, 1);
    set('a', 'c', 0, 1);
    const t = computeStandings(['a', 'b', 'c'], ms, { pointsWin: 3, pointsDraw: 1 });
    expect(t.map((r) => r.teamId)).toEqual(['c', 'a', 'b']);
    expect(t[0].points).toBe(4);
    expect(t[1].goalDiff).toBe(1);
  });
});

describe('knockout', () => {
  it('seedOrder evita que 1 y 2 se crucen antes de la final', () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('con 6 equipos los dos mejores pasan con bye', () => {
    const ms = buildBracket(ids(6));
    expect(ms.filter((m) => m.round === 0)).toHaveLength(4);
    const semis = ms.filter((m) => m.round === 1);
    expect(semis.map((m) => m.homeId)).toEqual(['t1', 't2']);
  });

  it('desempata por penales y avanza al ganador', () => {
    const t: Tournament = {
      id: 'x', name: 'x', mode: 'fifa', format: 'eliminatoria', createdAt: 0,
      teams: ids(4).map((id) => ({ id, name: id })), matches: [],
      settings: { doubleRound: false, pointsWin: 3, pointsDraw: 1, groupsCount: 2, qualifiersPerGroup: 2 },
    };
    let s = startTournament(t, false);
    const [m1, m2] = s.matches.filter((m) => m.round === 0);
    s = updateMatch(s, m1.id, { homeGoals: 1, awayGoals: 1, homePens: 4, awayPens: 3 });
    s = updateMatch(s, m2.id, { homeGoals: 0, awayGoals: 2 });
    const final = s.matches.find((m) => m.round === 1)!;
    expect(final.homeId).toBe(m1.homeId);
    expect(final.awayId).toBe(m2.awayId);
    s = updateMatch(s, final.id, { homeGoals: 3, awayGoals: 0 });
    expect(winnerOf(s)).toBe(m1.homeId);
    // corregir un resultado anterior reinicia la final
    s = updateMatch(s, m1.id, { homePens: 2, awayPens: 4 });
    const final2 = s.matches.find((m) => m.round === 1)!;
    expect(final2.homeId).toBe(m1.awayId);
    expect(final2.homeGoals).toBeNull();
    expect(koWinner(final2)).toBeNull();
  });
});

describe('grupos + eliminatoria', () => {
  it('clasifica a los primeros y segundos y arma el cuadro', () => {
    const t: Tournament = {
      id: 'x', name: 'x', mode: 'real', format: 'grupos', createdAt: 0,
      teams: ids(8).map((id) => ({ id, name: id })), matches: [],
      settings: { doubleRound: false, pointsWin: 3, pointsDraw: 1, groupsCount: 2, qualifiersPerGroup: 2 },
    };
    let s = startTournament(t, false);
    for (const m of s.matches) s = updateMatch(s, m.id, { homeGoals: Number(m.homeId!.slice(1)), awayGoals: Number(m.awayId!.slice(1)) });
    s = buildKnockoutFromGroups(s);
    const firstRound = s.matches.filter((m) => m.stage === 'ko' && m.round === 0);
    expect(firstRound).toHaveLength(2);
    // Grupo A: t1,t3,t5,t7 → gana t7, 2° t5. Grupo B: t2,t4,t6,t8 → gana t8, 2° t6.
    expect(firstRound.map((m) => [m.homeId, m.awayId])).toEqual([['t7', 't6'], ['t8', 't5']]);
  });
});
