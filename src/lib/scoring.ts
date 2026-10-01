import type { ChoiceQuality, MeterEffects, Meters } from '@/types/game';

/* ──────────────────────────────────────────────────────────────
 * Reglas de puntaje centralizadas: si quieres re-balancear el
 * juego, solo tocas este archivo.
 * ────────────────────────────────────────────────────────────── */

export interface SpeedTier {
  /** Fracción mínima de tiempo restante (0–1) para alcanzar el tramo. */
  minRatio: number;
  multiplier: number;
  label: string;
}

/** Tramos de velocidad: mientras más rápido respondes, mayor el multiplicador. */
export const SPEED_TIERS: SpeedTier[] = [
  { minRatio: 0.75, multiplier: 3, label: '¡Relámpago!' },
  { minRatio: 0.5, multiplier: 2, label: '¡Rápido!' },
  { minRatio: 0.25, multiplier: 1.5, label: 'A tiempo' },
  { minRatio: 0, multiplier: 1, label: 'Por poco' },
];

/** Cada acierto consecutivo previo suma +10 % de bonus, con tope de +50 %. */
export const STREAK_BONUS_STEP = 0.1;
export const STREAK_BONUS_CAP = 0.5;

export const DECISION_POINTS: Record<ChoiceQuality, number> = {
  good: 100,
  neutral: 30,
  bad: 0,
};

export const LEVEL_COMPLETION_POINTS = 250;

export function getSpeedTier(timeLeftMs: number, timeLimitMs: number): SpeedTier {
  const ratio = clamp(timeLeftMs / timeLimitMs, 0, 1);
  return SPEED_TIERS.find((tier) => ratio >= tier.minRatio) ?? SPEED_TIERS[SPEED_TIERS.length - 1];
}

export interface QuizPointsInput {
  basePoints: number;
  timeLeftMs: number;
  timeLimitMs: number;
  /** Aciertos consecutivos ANTES de esta respuesta. */
  streak: number;
}

export interface QuizPointsResult {
  points: number;
  multiplier: number;
  tierLabel: string;
  streakBonus: number;
}

export function calculateQuizPoints({
  basePoints,
  timeLeftMs,
  timeLimitMs,
  streak,
}: QuizPointsInput): QuizPointsResult {
  const tier = getSpeedTier(timeLeftMs, timeLimitMs);
  const streakBonus = Math.min(streak * STREAK_BONUS_STEP, STREAK_BONUS_CAP);
  return {
    points: Math.round(basePoints * tier.multiplier * (1 + streakBonus)),
    multiplier: tier.multiplier,
    tierLabel: tier.label,
    streakBonus,
  };
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function applyMeterEffects(meters: Meters, effects: MeterEffects): Meters {
  return {
    rentabilidad: clamp(meters.rentabilidad + (effects.rentabilidad ?? 0), 0, 100),
    reputacion: clamp(meters.reputacion + (effects.reputacion ?? 0), 0, 100),
  };
}
