import type { Match } from '../types';
import { uid } from './id';

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Orden estándar de cabezas de serie: con 8 → [1,8,4,5,2,7,3,6] (1 y 2 solo se cruzan en la final). */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const len = order.length * 2;
    order = order.flatMap((s) => [s, len + 1 - s]);
  }
  return order;
}

/**
 * Crea un cuadro eliminatorio. `seeds` va del mejor cabeza de serie al peor.
 * Si el número de equipos no es potencia de 2, los mejores reciben "bye" (pasan directo).
 */
export function buildBracket(seeds: string[]): Match[] {
  if (seeds.length < 2) return [];
  const size = nextPow2(seeds.length);
  const order = seedOrder(size);
  const totalRounds = Math.log2(size);
  const matches: Match[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const count = size / 2 ** (r + 1);
    for (let s = 0; s < count; s++) {
      const m: Match = {
        id: uid(), stage: 'ko', round: r, slot: s,
        homeId: null, awayId: null, homeGoals: null, awayGoals: null, homePens: null, awayPens: null,
      };
      if (r === 0) {
        m.homeId = seeds[order[2 * s] - 1] ?? null;
        m.awayId = seeds[order[2 * s + 1] - 1] ?? null;
      }
      matches.push(m);
    }
  }
  return propagate(matches);
}

/** Ganador de un partido eliminatorio, o null si aún no se define. */
export function koWinner(m: Match): string | null {
  // Bye: solo en la primera ronda
  if (m.round === 0) {
    if (m.homeId && !m.awayId) return m.homeId;
    if (m.awayId && !m.homeId) return m.awayId;
  }
  if (!m.homeId || !m.awayId || m.homeGoals === null || m.awayGoals === null) return null;
  if (m.homeGoals > m.awayGoals) return m.homeId;
  if (m.awayGoals > m.homeGoals) return m.awayId;
  const hp = m.homePens ?? null;
  const ap = m.awayPens ?? null;
  if (hp === null || ap === null || hp === ap) return null;
  return hp > ap ? m.homeId : m.awayId;
}

export function isBye(m: Match): boolean {
  return m.stage === 'ko' && m.round === 0 && (!m.homeId || !m.awayId);
}

/**
 * Lleva a los ganadores a la siguiente ronda. Si un equipo cambia en un partido
 * posterior (porque se corrigió un resultado), ese partido se reinicia.
 */
export function propagate(matches: Match[]): Match[] {
  const ko = matches.filter((m) => m.stage === 'ko');
  if (ko.length === 0) return matches;
  const byKey = new Map<string, Match>();
  const updated = matches.map((m) => ({ ...m }));
  for (const m of updated) if (m.stage === 'ko') byKey.set(`${m.round}-${m.slot}`, m);
  const maxRound = Math.max(...ko.map((m) => m.round));

  for (let r = 0; r < maxRound; r++) {
    for (const m of updated.filter((x) => x.stage === 'ko' && x.round === r)) {
      const next = byKey.get(`${r + 1}-${Math.floor(m.slot! / 2)}`);
      if (!next) continue;
      const winner = koWinner(m);
      const side = m.slot! % 2 === 0 ? 'homeId' : 'awayId';
      if (next[side] !== winner) {
        next[side] = winner;
        next.homeGoals = next.awayGoals = null;
        next.homePens = next.awayPens = null;
      }
    }
  }
  return updated;
}

export function roundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  switch (fromEnd) {
    case 1: return 'Final';
    case 2: return 'Semifinales';
    case 3: return 'Cuartos de final';
    case 4: return 'Octavos de final';
    case 5: return 'Dieciseisavos';
    default: return `Ronda ${round + 1}`;
  }
}

export function champion(matches: Match[]): string | null {
  const ko = matches.filter((m) => m.stage === 'ko');
  if (ko.length === 0) return null;
  const maxRound = Math.max(...ko.map((m) => m.round));
  const final = ko.find((m) => m.round === maxRound);
  return final ? koWinner(final) : null;
}
