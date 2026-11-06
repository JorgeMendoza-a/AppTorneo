import { useEffect, useState } from 'react';
import type { Tournament } from './types';
import { loadTournaments, saveTournaments } from './storage';
import { TournamentList } from './components/TournamentList';
import { CreateTournament } from './components/CreateTournament';
import { TournamentView } from './components/TournamentView';

type View = { name: 'list' } | { name: 'create' } | { name: 'tournament'; id: string };

export default function App() {
  const [tournaments, setTournaments] = useState<Tournament[]>(loadTournaments);
  const [view, setView] = useState<View>({ name: 'list' });

  useEffect(() => saveTournaments(tournaments), [tournaments]);

  const upsert = (t: Tournament) =>
    setTournaments((list) => (list.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? t : x)) : [t, ...list]));

  const remove = (id: string) => {
    setTournaments((list) => list.filter((x) => x.id !== id));
    setView({ name: 'list' });
  };

  const current = view.name === 'tournament' ? tournaments.find((t) => t.id === view.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView({ name: 'list' })}>
          <span className="ball">⚽</span> AppTorneo
        </button>
      </header>
      <main className="content">
        {view.name === 'list' && (
          <TournamentList
            tournaments={tournaments}
            onOpen={(id) => setView({ name: 'tournament', id })}
            onCreate={() => setView({ name: 'create' })}
            onImport={(t) => { upsert(t); setView({ name: 'tournament', id: t.id }); }}
          />
        )}
        {view.name === 'create' && (
          <CreateTournament
            onCancel={() => setView({ name: 'list' })}
            onCreate={(t) => { upsert(t); setView({ name: 'tournament', id: t.id }); }}
          />
        )}
        {view.name === 'tournament' && current && (
          <TournamentView tournament={current} onChange={upsert} onDelete={() => remove(current.id)} onBack={() => setView({ name: 'list' })} />
        )}
        {view.name === 'tournament' && !current && <p>Torneo no encontrado.</p>}
      </main>
    </div>
  );
}
