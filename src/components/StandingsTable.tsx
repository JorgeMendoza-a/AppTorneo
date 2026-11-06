import type { Match, Tournament } from '../types';
import { computeStandings } from '../logic/standings';
import { teamLabel, teamName } from '../logic/tournament';

interface Props {
  t: Tournament;
  teamIds: string[];
  matches: Match[];
  /** Cuántos clasifican (se resaltan). */
  highlight?: number;
  title?: string;
}

export function StandingsTable({ t, teamIds, matches, highlight = 0, title }: Props) {
  const rows = computeStandings(teamIds, matches, t.settings, (id) => teamName(t, id));
  return (
    <div className="card table-wrap">
      {title && <h3>{title}</h3>}
      <table className="standings">
        <thead>
          <tr>
            <th>#</th><th className="left">{t.mode === 'fifa' ? 'Jugador' : 'Equipo'}</th>
            <th title="Partidos jugados">PJ</th><th title="Ganados">G</th><th title="Empatados">E</th><th title="Perdidos">P</th>
            <th title="Goles a favor">GF</th><th title="Goles en contra">GC</th><th title="Diferencia de gol">DG</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.teamId} className={i < highlight ? 'qualify' : ''}>
              <td>{i + 1}</td>
              <td className="left">{teamLabel(t, r.teamId)}</td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td>{r.goalsFor}</td><td>{r.goalsAgainst}</td><td>{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              <td><b>{r.points}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
