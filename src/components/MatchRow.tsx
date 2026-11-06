import type { Match, Tournament } from '../types';
import { teamLabel } from '../logic/tournament';
import { isBye, koWinner } from '../logic/knockout';

interface Props {
  t: Tournament;
  m: Match;
  onSave: (patch: Partial<Match>) => void;
}

const toNum = (v: string): number | null => (v === '' ? null : Math.max(0, Math.floor(Number(v))));

export function MatchRow({ t, m, onSave }: Props) {
  if (isBye(m)) {
    return (
      <div className="match bye">
        <span className="team home">{teamLabel(t, m.homeId ?? m.awayId)}</span>
        <span className="score muted">pasa directo</span>
        <span className="team away muted">(bye)</span>
      </div>
    );
  }
  const pending = !m.homeId || !m.awayId;
  const isKo = m.stage === 'ko';
  const tied = isKo && m.homeGoals !== null && m.homeGoals === m.awayGoals;
  const winner = isKo ? koWinner(m) : null;

  return (
    <div className={`match ${pending ? 'pending' : ''}`}>
      <span className={`team home ${winner && winner === m.homeId ? 'win' : ''}`}>{m.homeId ? teamLabel(t, m.homeId) : 'Por definir'}</span>
      <span className="score">
        <input type="number" min={0} inputMode="numeric" disabled={pending} aria-label="Goles local"
          value={m.homeGoals ?? ''} onChange={(e) => onSave({ homeGoals: toNum(e.target.value) })} />
        <span>-</span>
        <input type="number" min={0} inputMode="numeric" disabled={pending} aria-label="Goles visitante"
          value={m.awayGoals ?? ''} onChange={(e) => onSave({ awayGoals: toNum(e.target.value) })} />
      </span>
      <span className={`team away ${winner && winner === m.awayId ? 'win' : ''}`}>{m.awayId ? teamLabel(t, m.awayId) : 'Por definir'}</span>
      {tied && (
        <span className="pens">
          Penales:
          <input type="number" min={0} aria-label="Penales local" value={m.homePens ?? ''} onChange={(e) => onSave({ homePens: toNum(e.target.value) })} />
          <span>-</span>
          <input type="number" min={0} aria-label="Penales visitante" value={m.awayPens ?? ''} onChange={(e) => onSave({ awayPens: toNum(e.target.value) })} />
        </span>
      )}
    </div>
  );
}
