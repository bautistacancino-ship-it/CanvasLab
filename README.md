# CanvasLab

Juego web para que estudiantes de diseño gráfico y animación construyan su Business Model Canvas haciendo.
Next.js 16 (App Router) · Tailwind CSS 4 · Zustand 5 (persistido en `localStorage`) · Framer Motion.

```bash
npm install
npm run dev
```

## Arquitectura

```
src/
├── app/
│   ├── layout.tsx                 # <html> + <StoreHydrator/>
│   └── (game)/                    # route group: todas comparten el HUD
│       ├── layout.tsx             # <GameHUD/> fijo: puntaje, racha, medidores
│       ├── page.tsx               # Elegir Core Business  →  mapa de niveles
│       ├── play/[blockId]/page.tsx# Un nivel = un bloque del Canvas (SSG ×9)
│       └── canvas/page.tsx        # Tablero final con los 9 bloques
├── components/
│   ├── game/
│   │   ├── LevelRunner.tsx        # Orquestador del Core Loop (máquina de fases)
│   │   ├── PhaseStepper.tsx
│   │   ├── theory/TheoryCards.tsx         # Fase 1
│   │   ├── quiz/TimedQuiz.tsx             # Fase 2
│   │   ├── quiz/CircularTimer.tsx
│   │   ├── simulation/DecisionSimulator.tsx # Fase 3
│   │   └── build/CanvasBlockForm.tsx      # Fase 4
│   ├── hud/        GameHUD · MeterGauge · AnimatedNumber
│   ├── home/       HomeScreen · BusinessPicker · LevelMap
│   ├── canvas/     CanvasBoard
│   └── providers/  StoreHydrator
├── data/                          # Contenido = data pura (luego vendrá de un CMS/API)
│   ├── businesses.ts
│   ├── canvasBlocks.ts            # Metadatos y posición en la grilla de los 9 bloques
│   └── levels/
│       ├── index.ts               # Registro: getLevel(businessId, blockId)
│       └── agencia-marketing/01-segmentos-clientes.ts
├── lib/scoring.ts                 # TODAS las reglas de puntaje y medidores
├── store/useGameStore.ts          # Zustand + persist
└── types/game.ts                  # Modelo de dominio
```

### Principios

- **Contenido separado de los componentes.** Un nivel es un objeto `LevelConfig`. Para agregar el nivel 2,
  o un Core Business nuevo, creas un archivo en `data/levels/` y lo registras en `index.ts`. No hay que tocar componentes.
- **Componentes de fase "tontos".** `TimedQuiz`, `DecisionSimulator`, `CanvasBlockForm` y `TheoryCards`
  reciben datos por props y avisan con callbacks (`onComplete`, `onDecision`). Solo `LevelRunner` sabe
  cómo se conectan con el store. Así se pueden probar o reutilizar por separado.
- **Reglas de puntaje en un solo lugar** (`lib/scoring.ts`), para re-balancear el juego sin buscar números en la UI.
- **Hidratación segura.** El store usa `skipHydration` y se rehidrata en `<StoreHydrator/>`. Las vistas esperan
  `hasHydrated` antes de mostrar el progreso, para evitar mismatches entre servidor y cliente.

### Store (`useGameStore`)

| Estado         | Descripción                                                   |
| -------------- | ------------------------------------------------------------- |
| `profile`      | `{ playerName, businessId, startedAt }`                       |
| `score`        | Puntaje total                                                 |
| `streak`       | Aciertos consecutivos (alimenta el bonus del quiz)            |
| `meters`       | `{ rentabilidad, reputacion }` de 0 a 100, parten en 50       |
| `progress`     | Por bloque: fase actual, resultado del quiz, decisiones       |
| `canvas`       | Por bloque: `{ fieldId: texto }` que se ve en el tablero      |
| `scoreLog`     | Últimos 50 eventos de puntaje (útil para feedback o analítica) |

Acciones: `startGame`, `setPhase`, `registerQuizAnswer`, `completeQuiz`, `makeDecision`,
`saveCanvasDraft`, `completeLevel`, `addPoints`, `applyEffects`, `resetGame`.

**Anti-farming:** recargar la página no regala puntos. El quiz puntúa una sola vez por bloque, en la simulación
cuenta solo la primera decisión de cada nodo y el bonus de nivel se entrega una sola vez.

### Puntaje

- Quiz: `basePoints × multiplicador de velocidad × (1 + bonus de racha)`
  - Tiempo restante ≥ 75 % → ×3 · ≥ 50 % → ×2 · ≥ 25 % → ×1.5 · resto → ×1
  - Cada acierto consecutivo previo suma +10 %, con tope de +50 %
- Simulación: decisión buena +100, discutible +30, mala 0, más los efectos en los medidores
- Nivel completado: +250
