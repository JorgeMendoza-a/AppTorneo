import { useRef } from 'react';
import type { Tournament } from '../types';
import { isTournament } from '../storage';
import { progress, teamName, winnerOf } from '../logic/tournament';
import { FORMAT_LABEL, MODE_LABEL } from './labels';

interface Props {
  tournaments: Tournament[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onImport: (t: Tournament) => void;
}

export function TournamentList({ tournaments, onOpen, onCreate, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!isTournament(data)) throw new Error();
      onImport(data);
    } catch {
      alert('El archivo no es un torneo válido.');
    }
  };

  return (
    <section>
      <div className="row between">
        <h1>Mis torneos</h1>
        <div className="row gap">
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>Importar</button>
          <button className="btn primary" onClick={onCreate}>+ Nuevo torneo</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>

      {tournaments.length === 0 ? (
        <div className="empty card">
          <p className="big">🏆</p>
          <p>Aún no tienes torneos. Crea uno para tu liga del barrio o para jugar FIFA con tus amigos.</p>
          <button className="btn primary" onClick={onCreate}>Crear mi primer torneo</button>
        </div>
      ) : (
        <div className="grid">
          {tournaments.map((t) => {
            const p = progress(t);
            const champ = winnerOf(t);
            return (
              <button key={t.id} className="card tcard" onClick={() => onOpen(t.id)}>
                <div className="row between">
                  <strong>{t.name}</strong>
                  <span className={`tag ${t.mode}`}>{t.mode === 'fifa' ? '🎮 FIFA' : '⚽ Real'}</span>
                </div>
                <small className="muted">{FORMAT_LABEL[t.format]} · {t.teams.length} {t.mode === 'fifa' ? 'jugadores' : 'equipos'}</small>
                {champ ? (
                  <div className="champ-mini">🏆 {teamName(t, champ)}</div>
                ) : p.total > 0 ? (
                  <div className="bar"><div style={{ width: `${(p.played / p.total) * 100}%` }} /></div>
                ) : (
                  <small className="muted">Sin iniciar · {MODE_LABEL[t.mode]}</small>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
