import type { Match, Tournament } from '../types';
import { isBye, koWinner, roundName } from '../logic/knockout';
import { teamName } from '../logic/tournament';

export function Bracket({ t }: { t: Tournament }) {
  const ko = t.matches.filter((m) => m.stage === 'ko');
  if (ko.length === 0) return <p className="muted">La fase eliminatoria aún no se ha generado.</p>;
  const totalRounds = Math.max(...ko.map((m) => m.round)) + 1;

  return (
    <div className="bracket">
      {Array.from({ length: totalRounds }, (_, r) => (
        <div className="bracket-round" key={r}>
          <h4>{roundName(r, totalRounds)}</h4>
          <div className="bracket-matches">
            {ko.filter((m) => m.round === r).sort((a, b) => a.slot! - b.slot!).map((m) => <BracketMatch key={m.id} t={t} m={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function BracketMatch({ t, m }: { t: Tournament; m: Match }) {
  const w = koWinner(m);
  const bye = isBye(m);
  const line = (id: string | null, goals: number | null, pens?: number | null) => (
    <div className={`bline ${w && w === id ? 'win' : ''}`}>
      <span>{id ? teamName(t, id) : bye ? 'bye' : 'Por definir'}</span>
      <b>{goals ?? ''}{pens != null && m.homeGoals === m.awayGoals ? ` (${pens})` : ''}</b>
    </div>
  );
  return (
    <div className={`bmatch ${bye ? 'bye' : ''}`}>
      {line(m.homeId, m.homeGoals, m.homePens)}
      {line(m.awayId, m.awayGoals, m.awayPens)}
    </div>
  );
}
