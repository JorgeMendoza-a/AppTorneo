import { useState } from 'react';
import type { Match, Team, Tournament } from '../types';
import {
  buildKnockoutFromGroups, groupLetters, groupMembers, groupStageComplete, hasKnockout, hasStarted,
  progress, startTournament, teamLabel, updateMatch, winnerOf,
} from '../logic/tournament';
import { roundName } from '../logic/knockout';
import { uid } from '../logic/id';
import { downloadJson } from '../storage';
import { MatchRow } from './MatchRow';
import { StandingsTable } from './StandingsTable';
import { Bracket } from './Bracket';
import { FORMAT_LABEL, MODE_LABEL } from './labels';

type Tab = 'partidos' | 'tabla' | 'llaves' | 'equipos' | 'opciones';

interface Props {
  tournament: Tournament;
  onChange: (t: Tournament) => void;
  onDelete: () => void;
  onBack: () => void;
}

export function TournamentView({ tournament: t, onChange, onDelete, onBack }: Props) {
  const started = hasStarted(t);
  const [tab, setTab] = useState<Tab>(started ? 'partidos' : 'equipos');
  const champ = winnerOf(t);
  const p = progress(t);
  const noun = t.mode === 'fifa' ? 'Jugadores' : 'Equipos';

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'partidos', label: 'Partidos', show: started },
    { id: 'tabla', label: t.format === 'grupos' ? 'Grupos' : 'Tabla', show: started && t.format !== 'eliminatoria' },
    { id: 'llaves', label: 'Llaves', show: started && t.format !== 'liga' },
    { id: 'equipos', label: noun, show: true },
    { id: 'opciones', label: 'Opciones', show: true },
  ];

  return (
    <section>
      <button className="link" onClick={onBack}>← Mis torneos</button>
      <div className="row between wrap">
        <div>
          <h1>{t.name}</h1>
          <small className="muted">{MODE_LABEL[t.mode]} · {FORMAT_LABEL[t.format]}{t.settings.doubleRound && t.format !== 'eliminatoria' ? ' · ida y vuelta' : ''}</small>
        </div>
        {started && <div className="progress-label">{p.played}/{p.total} partidos jugados</div>}
      </div>

      {champ && (
        <div className="champion card">
          <span className="trophy">🏆</span>
          <div><small>Campeón</small><strong>{teamLabel(t, champ)}</strong></div>
        </div>
      )}

      <nav className="tabs">
        {tabs.filter((x) => x.show).map((x) => (
          <button key={x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>{x.label}</button>
        ))}
      </nav>

      {tab === 'partidos' && started && <MatchesTab t={t} onChange={onChange} goTo={setTab} />}
      {tab === 'tabla' && started && <TableTab t={t} />}
      {tab === 'llaves' && started && <Bracket t={t} />}
      {tab === 'equipos' && <TeamsTab t={t} onChange={onChange} onStarted={() => setTab('partidos')} />}
      {tab === 'opciones' && <OptionsTab t={t} onChange={onChange} onDelete={onDelete} />}
    </section>
  );
}

function MatchesTab({ t, onChange, goTo }: { t: Tournament; onChange: (t: Tournament) => void; goTo: (tab: Tab) => void }) {
  const save = (m: Match) => (patch: Partial<Match>) => onChange(updateMatch(t, m.id, patch));
  const sections: { key: string; title: string; matches: Match[] }[] = [];

  const league = t.matches.filter((m) => m.stage !== 'ko');
  const rounds = [...new Set(league.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of rounds) {
    const ms = league.filter((m) => m.round === r).sort((a, b) => (a.group ?? '').localeCompare(b.group ?? ''));
    sections.push({ key: `j${r}`, title: `Jornada ${r + 1}`, matches: ms });
  }

  const ko = t.matches.filter((m) => m.stage === 'ko');
  if (ko.length) {
    const total = Math.max(...ko.map((m) => m.round)) + 1;
    for (let r = 0; r < total; r++) {
      sections.push({ key: `k${r}`, title: roundName(r, total), matches: ko.filter((m) => m.round === r).sort((a, b) => a.slot! - b.slot!) });
    }
  }

  const needsKo = t.format === 'grupos' && groupStageComplete(t) && !hasKnockout(t);

  return (
    <div>
      {needsKo && (
        <div className="card notice">
          <p>¡Terminó la fase de grupos! Clasifican los {t.settings.qualifiersPerGroup} mejores de cada grupo.</p>
          <button className="btn primary" onClick={() => { onChange(buildKnockoutFromGroups(t)); goTo('llaves'); }}>Generar fase final</button>
        </div>
      )}
      {sections.map((s) => (
        <div key={s.key} className="card round">
          <h3>{s.title}</h3>
          {s.matches.map((m) => (
            <div key={m.id}>
              {m.group && <span className="group-tag">Grupo {m.group}</span>}
              <MatchRow t={t} m={m} onSave={save(m)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TableTab({ t }: { t: Tournament }) {
  if (t.format === 'liga') {
    return <StandingsTable t={t} teamIds={t.teams.map((x) => x.id)} matches={t.matches} highlight={1} />;
  }
  return (
    <div className="grid wide">
      {groupLetters(t).map((g) => (
        <StandingsTable key={g} t={t} title={`Grupo ${g}`} teamIds={groupMembers(t, g)}
          matches={t.matches.filter((m) => m.stage === 'grupo' && m.group === g)} highlight={t.settings.qualifiersPerGroup} />
      ))}
    </div>
  );
}

function TeamsTab({ t, onChange, onStarted }: { t: Tournament; onChange: (t: Tournament) => void; onStarted: () => void }) {
  const started = hasStarted(t);
  const isFifa = t.mode === 'fifa';
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const minTeams = t.format === 'grupos' ? t.settings.groupsCount * 2 : 2;

  const patchTeam = (id: string, patch: Partial<Team>) =>
    onChange({ ...t, teams: t.teams.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

  const add = () => {
    if (!name.trim()) return;
    onChange({ ...t, teams: [...t.teams, { id: uid(), name: name.trim(), club: club.trim() || undefined }] });
    setName(''); setClub('');
  };

  return (
    <div className="card">
      {!started && (
        <form className="row gap" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={isFifa ? 'Jugador' : 'Equipo'} />
          {isFifa && <input value={club} onChange={(e) => setClub(e.target.value)} placeholder="Club (opcional)" />}
          <button className="btn" type="submit">Agregar</button>
        </form>
      )}
      <ul className="team-list">
        {t.teams.map((x, i) => (
          <li key={x.id}>
            <span className="muted">{i + 1}.</span>
            <input value={x.name} onChange={(e) => patchTeam(x.id, { name: e.target.value })} aria-label="Nombre" />
            {isFifa && <input value={x.club ?? ''} placeholder="Club" onChange={(e) => patchTeam(x.id, { club: e.target.value || undefined })} aria-label="Club" />}
            {!started && <button className="btn ghost small" onClick={() => onChange({ ...t, teams: t.teams.filter((y) => y.id !== x.id) })}>Quitar</button>}
          </li>
        ))}
      </ul>
      {!started && (
        <div className="row gap end">
          {t.teams.length < minTeams && <small className="muted">Necesitas al menos {minTeams}.</small>}
          <button className="btn primary" disabled={t.teams.length < minTeams}
            onClick={() => { onChange(startTournament(t)); onStarted(); }}>
            Sortear e iniciar torneo
          </button>
        </div>
      )}
      {started && <small className="muted">Puedes corregir nombres en cualquier momento. Para agregar o quitar, reinicia el torneo en Opciones.</small>}
    </div>
  );
}

function OptionsTab({ t, onChange, onDelete }: { t: Tournament; onChange: (t: Tournament) => void; onDelete: () => void }) {
  return (
    <div className="card options">
      <div className="row between">
        <div><b>Exportar</b><br /><small className="muted">Descarga un respaldo (.json) para compartirlo o importarlo en otro dispositivo.</small></div>
        <button className="btn" onClick={() => downloadJson(t)}>Descargar</button>
      </div>
      {t.format === 'grupos' && hasKnockout(t) && (
        <div className="row between">
          <div><b>Regenerar fase final</b><br /><small className="muted">Útil si corregiste resultados de grupos. Borra los resultados de la eliminatoria.</small></div>
          <button className="btn" onClick={() => confirm('¿Regenerar la fase final?') && onChange(buildKnockoutFromGroups(t))}>Regenerar</button>
        </div>
      )}
      {hasStarted(t) && (
        <div className="row between">
          <div><b>Reiniciar</b><br /><small className="muted">Borra el calendario y todos los resultados. Mantiene los {t.mode === 'fifa' ? 'jugadores' : 'equipos'}.</small></div>
          <button className="btn danger" onClick={() => confirm('¿Borrar todos los partidos y resultados?') && onChange({ ...t, matches: [] })}>Reiniciar</button>
        </div>
      )}
      <div className="row between">
        <div><b>Eliminar torneo</b><br /><small className="muted">No se puede deshacer.</small></div>
        <button className="btn danger" onClick={() => confirm(`¿Eliminar "${t.name}"?`) && onDelete()}>Eliminar</button>
      </div>
    </div>
  );
}
