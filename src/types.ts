/** "real" = torneo de fútbol con equipos reales; "fifa" = torneo de videojuego entre jugadores. */
export type Mode = 'real' | 'fifa';

/** liga = todos contra todos; eliminatoria = llaves directas; grupos = fase de grupos + eliminatoria. */
export type Format = 'liga' | 'eliminatoria' | 'grupos';

export interface Team {
  id: string;
  /** Nombre del equipo (real) o del jugador (FIFA). */
  name: string;
  /** Solo FIFA: club o selección que usa el jugador. */
  club?: string;
}

export type Stage = 'liga' | 'grupo' | 'ko';

export interface Match {
  id: string;
  stage: Stage;
  /** Jornada (liga/grupos) o ronda de la eliminatoria (0 = primera ronda). */
  round: number;
  /** Letra del grupo (solo stage = 'grupo'). */
  group?: string;
  /** Posición dentro de la ronda eliminatoria (solo stage = 'ko'). */
  slot?: number;
  homeId: string | null;
  awayId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  /** Penales, solo para desempatar en eliminatoria. */
  homePens?: number | null;
  awayPens?: number | null;
}

export interface Settings {
  doubleRound: boolean;
  pointsWin: number;
  pointsDraw: number;
  groupsCount: number;
  qualifiersPerGroup: number;
}

export interface Tournament {
  id: string;
  name: string;
  mode: Mode;
  format: Format;
  createdAt: number;
  teams: Team[];
  matches: Match[];
  settings: Settings;
}

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}
