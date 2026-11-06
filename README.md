# AppTorneo ⚽🎮

App web para organizar torneos de fútbol, tanto **reales** (equipos en cancha) como de **FIFA / videojuegos** (jugadores que eligen un club).

## Qué hace

- **Tres formatos**
  - **Liga**: todos contra todos, con opción de ida y vuelta.
  - **Eliminación directa**: llaves con cabezas de serie; si el número de equipos no es potencia de 2, los mejores pasan directo (bye).
  - **Grupos + eliminatoria**: estilo Mundial. Eliges cuántos grupos y cuántos clasifican por grupo.
- **Sorteo automático** del calendario.
- **Carga de resultados** partido a partido, con **penales** cuando hay empate en la eliminatoria.
- **Tabla de posiciones** automática (PJ, G, E, P, GF, GC, DG, Pts). Desempate: puntos → diferencia de gol → goles a favor → enfrentamiento directo.
- **Cuadro de llaves**: los ganadores avanzan solos. Si corriges un resultado, las rondas siguientes se ajustan.
- **Campeón** destacado al terminar.
- **Modo FIFA**: cada participante es un jugador con el club que usa.
- **Respaldo**: exportar e importar torneos en `.json`. Todo se guarda en el navegador (localStorage).

## Cómo correrla

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm test         # tests de la lógica (calendarios, tablas, llaves)
npm run build    # versión de producción en dist/
```

## Estructura

```
src/
  types.ts              Modelos: Tournament, Team, Match…
  logic/
    fixtures.ts         Calendario todos contra todos (método del círculo) y grupos
    standings.ts        Tabla de posiciones y desempates
    knockout.ts         Cuadro eliminatorio, byes, penales, avance de ganadores
    tournament.ts       Operaciones del torneo (iniciar, cargar resultado, pasar a fase final)
    logic.test.ts       Tests
  components/           Pantallas (lista, crear torneo, partidos, tabla, llaves…)
  storage.ts            Guardado local e importación/exportación
```

## Ideas para siguientes pasos

- Goleadores y tarjetas (para torneos reales).
- Estadísticas históricas por jugador entre torneos de FIFA.
- Cuentas de usuario y base de datos en la nube para compartir el torneo con un link.
- Fechas, horarios y canchas para cada partido.
- App móvil (PWA o React Native).
