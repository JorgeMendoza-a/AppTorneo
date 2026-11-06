import { useState } from 'react';
import type { Format, Mode, Team, Tournament } from '../types';
import { uid } from '../logic/id';
import { FORMAT_LABEL } from './labels';

interface Props {
  onCreate: (t: Tournament) => void;
  onCancel: () => void;
}

export function CreateTournament({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('real');
  const [format, setFormat] = useState<Format>('liga');
  const [doubleRound, setDoubleRound] = useState(false);
  const [groupsCount, setGroupsCount] = useState(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [club, setClub] = useState('');

  const isFifa = mode === 'fifa';
  const minTeams = format === 'grupos' ? groupsCount * 2 : 2;
  const smallestGroup = Math.floor(teams.length / groupsCount);
  const groupsOk = format !== 'grupos' || (smallestGroup >= 2 && qualifiersPerGroup <= smallestGroup);
  const canCreate = name.trim() !== '' && teams.length >= minTeams && groupsOk;

  const addTeam = () => {
    const n = teamName.trim();
    if (!n) return;
    if (teams.some((t) => t.name.toLowerCase() === n.toLowerCase())) {
      alert('Ya existe con ese nombre.');
      return;
    }
    setTeams([...teams, { id: uid(), name: n, club: isFifa && club.trim() ? club.trim() : undefined }]);
    setTeamName('');
    setClub('');
  };

  const submit = () => {
    if (!canCreate) return;
    onCreate({
      id: uid(),
      name: name.trim(),
      mode,
      format,
      createdAt: Date.now(),
      teams,
      matches: [],
      settings: { doubleRound, pointsWin: 3, pointsDraw: 1, groupsCount, qualifiersPerGroup },
    });
  };

  return (
    <section className="card form">
      <h1>Nuevo torneo</h1>

      <label>Nombre del torneo
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Copa del Barrio 2026" autoFocus />
      </label>

      <fieldset>
        <legend>Tipo</legend>
        <div className="choice">
          <button type="button" className={mode === 'real' ? 'on' : ''} onClick={() => setMode('real')}>
            ⚽ <b>Fútbol real</b><small>Equipos que juegan en cancha</small>
          </button>
          <button type="button" className={mode === 'fifa' ? 'on' : ''} onClick={() => setMode('fifa')}>
            🎮 <b>FIFA / videojuego</b><small>Jugadores que eligen un club</small>
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Formato</legend>
        <div className="choice three">
          {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => (
            <button type="button" key={f} className={format === f ? 'on' : ''} onClick={() => setFormat(f)}>
              <b>{FORMAT_LABEL[f]}</b>
            </button>
          ))}
        </div>
      </fieldset>

      {format !== 'eliminatoria' && (
        <label className="check">
          <input type="checkbox" checked={doubleRound} onChange={(e) => setDoubleRound(e.target.checked)} />
          Ida y vuelta
        </label>
      )}

      {format === 'grupos' && (
        <div className="row gap">
          <label>Número de grupos
            <input type="number" min={2} max={8} value={groupsCount} onChange={(e) => setGroupsCount(clamp(+e.target.value, 2, 8))} />
          </label>
          <label>Clasifican por grupo
            <input type="number" min={1} max={4} value={qualifiersPerGroup} onChange={(e) => setQualifiersPerGroup(clamp(+e.target.value, 1, 4))} />
          </label>
        </div>
      )}

      <fieldset>
        <legend>{isFifa ? 'Jugadores' : 'Equipos'} ({teams.length})</legend>
        <form className="row gap" onSubmit={(e) => { e.preventDefault(); addTeam(); }}>
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder={isFifa ? 'Nombre del jugador / gamertag' : 'Nombre del equipo'} />
          {isFifa && <input value={club} onChange={(e) => setClub(e.target.value)} placeholder="Club que usa (opcional)" />}
          <button className="btn" type="submit">Agregar</button>
        </form>
        <ul className="chips">
          {teams.map((t) => (
            <li key={t.id}>
              {t.name}{t.club && <small> · {t.club}</small>}
              <button aria-label="Quitar" onClick={() => setTeams(teams.filter((x) => x.id !== t.id))}>×</button>
            </li>
          ))}
        </ul>
        {teams.length < minTeams && <small className="muted">Necesitas al menos {minTeams}.</small>}
        {format === 'grupos' && teams.length >= minTeams && !groupsOk && (
          <small className="warn">Con {teams.length} y {groupsCount} grupos no pueden clasificar {qualifiersPerGroup} por grupo.</small>
        )}
      </fieldset>

      <div className="row gap end">
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn primary" disabled={!canCreate} onClick={submit}>Crear torneo</button>
      </div>
    </section>
  );
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}
