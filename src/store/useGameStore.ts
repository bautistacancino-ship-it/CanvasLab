import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DECISION_POINTS,
  LEVEL_COMPLETION_POINTS,
  applyMeterEffects,
} from '@/lib/scoring';
import type {
  BlockPhase,
  BlockProgress,
  BusinessId,
  CanvasBlockId,
  CanvasEntry,
  Meters,
  MeterEffects,
  PlayerProfile,
  QuizResult,
  SimulationChoice,
} from '@/types/game';

/* ──────────────────────────────────────────────────────────────
 * Store global del juego (Zustand + persist → localStorage).
 *
 * Reglas anti-farming (refrescar la página no regala puntos):
 *  - Los puntos del quiz se suman una sola vez por bloque.
 *  - En la simulación cuenta SOLO la primera decisión por nodo
 *    ("en la vida real no hay Ctrl+Z").
 *  - El bonus de nivel completado se entrega una sola vez.
 * ────────────────────────────────────────────────────────────── */

export const STORAGE_KEY = 'canvaslab:v1';
/** Clave usada antes del cambio de nombre (se migra una vez en StoreHydrator). */
export const LEGACY_STORAGE_KEY = 'canvas-quest:v1';

export const INITIAL_METERS: Meters = { rentabilidad: 50, reputacion: 50 };

export interface ScoreEvent {
  points: number;
  reason: string;
  at: string;
}

interface GameData {
  profile: PlayerProfile | null;
  score: number;
  streak: number;
  bestStreak: number;
  meters: Meters;
  progress: Partial<Record<CanvasBlockId, BlockProgress>>;
  canvas: Partial<Record<CanvasBlockId, CanvasEntry>>;
  scoreLog: ScoreEvent[];
}

interface GameActions {
  startGame: (businessId: BusinessId, playerName: string) => void;
  addPoints: (points: number, reason: string) => void;
  registerQuizAnswer: (correct: boolean) => void;
  applyEffects: (effects: MeterEffects) => void;
  setPhase: (blockId: CanvasBlockId, phase: BlockPhase) => void;
  completeQuiz: (blockId: CanvasBlockId, result: QuizResult) => void;
  makeDecision: (blockId: CanvasBlockId, nodeId: string, choice: SimulationChoice) => void;
  saveCanvasDraft: (blockId: CanvasBlockId, entry: CanvasEntry) => void;
  completeLevel: (blockId: CanvasBlockId, entry: CanvasEntry) => void;
  resetGame: () => void;
}

interface HydrationState {
  hasHydrated: boolean;
}

export type GameStore = GameData & GameActions & HydrationState;

const initialData: GameData = {
  profile: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  meters: INITIAL_METERS,
  progress: {},
  canvas: {},
  scoreLog: [],
};

const MAX_LOG = 50;

function patchProgress(
  progress: GameData['progress'],
  blockId: CanvasBlockId,
  patch: Partial<BlockProgress>,
): GameData['progress'] {
  const current = progress[blockId] ?? { phase: 'theory', decisions: [] };
  return { ...progress, [blockId]: { ...current, ...patch } };
}

function withPoints(state: GameData, points: number, reason: string): Partial<GameData> {
  if (points <= 0) return {};
  return {
    score: state.score + points,
    scoreLog: [{ points, reason, at: new Date().toISOString() }, ...state.scoreLog].slice(0, MAX_LOG),
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialData,
      hasHydrated: false,

      startGame: (businessId, playerName) =>
        set({
          ...initialData,
          profile: {
            businessId,
            playerName: playerName.trim() || 'Estudiante',
            startedAt: new Date().toISOString(),
          },
        }),

      addPoints: (points, reason) => set((s) => withPoints(s, points, reason)),

      registerQuizAnswer: (correct) =>
        set((s) => {
          const streak = correct ? s.streak + 1 : 0;
          return { streak, bestStreak: Math.max(s.bestStreak, streak) };
        }),

      applyEffects: (effects) => set((s) => ({ meters: applyMeterEffects(s.meters, effects) })),

      setPhase: (blockId, phase) =>
        set((s) => ({ progress: patchProgress(s.progress, blockId, { phase }) })),

      completeQuiz: (blockId, result) =>
        set((s) => {
          const alreadyScored = Boolean(s.progress[blockId]?.quiz);
          return {
            ...(alreadyScored ? {} : withPoints(s, result.points, `Quiz · ${blockId}`)),
            progress: patchProgress(s.progress, blockId, {
              phase: 'simulation',
              quiz: s.progress[blockId]?.quiz ?? result,
            }),
          };
        }),

      makeDecision: (blockId, nodeId, choice) =>
        set((s) => {
          const decisions = s.progress[blockId]?.decisions ?? [];
          if (decisions.some((d) => d.nodeId === nodeId)) return {};
          return {
            ...withPoints(s, DECISION_POINTS[choice.quality], `Decisión · ${choice.id}`),
            meters: applyMeterEffects(s.meters, choice.effects),
            progress: patchProgress(s.progress, blockId, {
              decisions: [...decisions, { nodeId, choiceId: choice.id, quality: choice.quality }],
            }),
          };
        }),

      saveCanvasDraft: (blockId, entry) =>
        set((s) => ({ canvas: { ...s.canvas, [blockId]: entry } })),

      completeLevel: (blockId, entry) =>
        set((s) => {
          const alreadyDone = s.progress[blockId]?.phase === 'done';
          return {
            ...(alreadyDone ? {} : withPoints(s, LEVEL_COMPLETION_POINTS, `Nivel completado · ${blockId}`)),
            canvas: { ...s.canvas, [blockId]: entry },
            progress: patchProgress(s.progress, blockId, {
              phase: 'done',
              completedAt: s.progress[blockId]?.completedAt ?? new Date().toISOString(),
            }),
          };
        }),

      resetGame: () => set({ ...initialData }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Rehidratamos manualmente desde <StoreHydrator/> para evitar
      // mismatches entre el HTML del servidor y el estado del cliente.
      skipHydration: true,
      partialize: ({ profile, score, streak, bestStreak, meters, progress, canvas, scoreLog }) => ({
        profile,
        score,
        streak,
        bestStreak,
        meters,
        progress,
        canvas,
        scoreLog,
      }),
      onRehydrateStorage: () => () => {
        useGameStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/* ─── Selectores reutilizables ────────────────────────────────── */

export const useHasHydrated = () => useGameStore((s) => s.hasHydrated);

export const selectBlockPhase =
  (blockId: CanvasBlockId) =>
  (s: GameStore): BlockPhase =>
    s.progress[blockId]?.phase ?? 'theory';

export const selectIsBlockDone =
  (blockId: CanvasBlockId) =>
  (s: GameStore): boolean =>
    s.progress[blockId]?.phase === 'done';
