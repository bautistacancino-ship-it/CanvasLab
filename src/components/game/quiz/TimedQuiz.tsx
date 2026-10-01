'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Blob } from '@/components/ui/Blob';
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/components/ui/Card';
import { calculateQuizPoints, getSpeedTier } from '@/lib/scoring';
import { BLOB_COLORS, TONES, toneAt } from '@/lib/tones';
import { useGameStore } from '@/store/useGameStore';
import type { QuizQuestion, QuizResult } from '@/types/game';
import { CircularTimer } from './CircularTimer';

const TICK_MS = 100;

type Feedback =
  | { kind: 'correct'; points: number; multiplier: number; tierLabel: string; streakBonus: number }
  | { kind: 'wrong' }
  | { kind: 'timeout' };

export interface QuizAnswerEvent {
  questionId: string;
  optionId: string | null;
  correct: boolean;
  points: number;
  timeLeftMs: number;
}

interface TimedQuizProps {
  questions: QuizQuestion[];
  timeLimitSec?: number;
  basePoints?: number;
  /** Se dispara por cada respuesta (útil para analítica). */
  onAnswer?: (event: QuizAnswerEvent) => void;
  /** Se dispara al cerrar la última pregunta con el resumen del quiz. */
  onComplete: (result: QuizResult) => void;
}

const EMPTY_TALLY: QuizResult = { correct: 0, total: 0, points: 0, bestMultiplier: 1 };

export function TimedQuiz({ questions, timeLimitSec = 15, basePoints = 50, onAnswer, onComplete }: TimedQuizProps) {
  const limitMs = timeLimitSec * 1000;
  const streak = useGameStore((s) => s.streak);
  const registerQuizAnswer = useGameStore((s) => s.registerQuizAnswer);

  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(limitMs);
  const [tally, setTally] = useState<QuizResult>(EMPTY_TALLY);

  // El deadline vive en un ref: calculamos el tiempo restante contra el reloj
  // real (performance.now) para que el contador no "derive" si el tab se laguea.
  const deadlineRef = useRef(0);
  const answeredRef = useRef(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  useEffect(() => {
    deadlineRef.current = performance.now() + limitMs;
    answeredRef.current = false;
  }, [index, limitMs]);

  const resolve = useCallback(
    (optionId: string | null) => {
      if (answeredRef.current) return;
      answeredRef.current = true;

      const remaining = Math.max(0, deadlineRef.current - performance.now());
      const correct = optionId !== null && optionId === question.correctOptionId;
      let points = 0;
      let multiplier = 1;

      if (correct) {
        const calc = calculateQuizPoints({ basePoints, timeLeftMs: remaining, timeLimitMs: limitMs, streak });
        points = calc.points;
        multiplier = calc.multiplier;
        setFeedback({ kind: 'correct', ...calc });
      } else {
        setFeedback({ kind: optionId === null ? 'timeout' : 'wrong' });
      }

      setSelectedId(optionId);
      setTimeLeftMs(remaining);
      setTally((t) => ({
        correct: t.correct + (correct ? 1 : 0),
        total: t.total + 1,
        points: t.points + points,
        bestMultiplier: Math.max(t.bestMultiplier, multiplier),
      }));
      registerQuizAnswer(correct);
      onAnswer?.({ questionId: question.id, optionId, correct, points, timeLeftMs: remaining });
    },
    [basePoints, limitMs, onAnswer, question, registerQuizAnswer, streak],
  );

  // Loop del temporizador: corre solo mientras se espera respuesta.
  useEffect(() => {
    if (feedback) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, deadlineRef.current - performance.now());
      setTimeLeftMs(remaining);
      if (remaining === 0) resolve(null);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [feedback, resolve]);

  const goNext = () => {
    if (isLast) {
      onComplete(tally);
      return;
    }
    setIndex((i) => i + 1);
    setSelectedId(null);
    setFeedback(null);
    setTimeLeftMs(limitMs);
  };

  const liveTier = getSpeedTier(timeLeftMs, limitMs);
  const isCorrect = feedback?.kind === 'correct';

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className={`${cardClass} relative p-5 sm:p-7`}>
        {/* Cabecera: progreso + puntos + multiplicador + timer */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="rounded-full bg-surface px-3 py-1 font-display text-sm font-semibold text-muted">
              Pregunta {index + 1}/{questions.length}
            </span>
            <div className="mt-3 flex gap-1.5">
              {questions.map((q, i) => (
                <span
                  key={q.id}
                  className={`h-2 flex-1 rounded-full transition-colors sm:w-10 sm:flex-none ${
                    i < index ? 'bg-lavender-strong' : i === index ? 'bg-lavender-strong/40' : 'bg-line'
                  }`}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sun px-3 py-1 font-display text-sm font-semibold">
                ★ <span className="tabular-nums">{tally.points}</span> pts
              </span>
              {streak > 1 && (
                <span className="rounded-full bg-peach px-3 py-1 font-display text-sm font-semibold text-peach-strong">
                  🔥 ×{streak}
                </span>
              )}
            </div>
          </div>

          <div className="relative shrink-0">
            <CircularTimer timeLeftMs={timeLeftMs} totalMs={limitMs} />
            <AnimatePresence mode="popLayout">
              {!feedback && (
                <motion.span
                  key={liveTier.multiplier}
                  initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 8 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute -right-2 -top-2 rounded-full bg-linear-to-r from-[#ffac3a] to-[#ff5fa2] px-2.5 py-1 font-display text-sm font-bold text-white shadow-soft"
                >
                  ×{liveTier.multiplier}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            <h3 className="mb-5 font-display text-2xl font-bold leading-snug">{question.prompt}</h3>

            <div className="grid gap-2.5">
              {question.options.map((option, i) => {
                const optionCorrect = option.id === question.correctOptionId;
                const isSelected = option.id === selectedId;
                const state = !feedback ? 'idle' : optionCorrect ? 'correct' : isSelected ? 'wrong' : 'dim';
                const tone = toneAt(i);

                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() => resolve(option.id)}
                    whileHover={!feedback ? { scale: 1.01 } : undefined}
                    whileTap={!feedback ? { scale: 0.98 } : undefined}
                    animate={
                      state === 'correct'
                        ? { scale: [1, 1.04, 1] }
                        : state === 'wrong'
                          ? { x: [0, -10, 10, -6, 6, 0] }
                          : { scale: 1, x: 0 }
                    }
                    transition={{ duration: 0.4 }}
                    className={`flex items-center gap-3 rounded-[22px] p-2 pr-4 text-left font-medium transition-colors ${
                      {
                        idle: 'bg-surface ring-1 ring-line hover:bg-white hover:ring-2 hover:ring-lavender-strong/40',
                        correct: 'bg-lime ring-2 ring-lime-strong',
                        wrong: 'bg-pink ring-2 ring-pink-strong',
                        dim: 'bg-surface text-muted opacity-60',
                      }[state]
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold ${
                        state === 'correct'
                          ? 'bg-lime-strong text-white'
                          : state === 'wrong'
                            ? 'bg-pink-strong text-white'
                            : `bg-white ${TONES[tone].text}`
                      }`}
                    >
                      {state === 'correct' ? '✓' : state === 'wrong' ? '✗' : String.fromCharCode(65 + i)}
                    </span>
                    {option.text}
                  </motion.button>
                );
              })}
            </div>

            {/* Puntos flotantes al acertar */}
            <AnimatePresence>
              {feedback?.kind === 'correct' && (
                <motion.div
                  key={`float-${question.id}`}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -90, scale: 1.3 }}
                  transition={{ duration: 1.4, times: [0, 0.15, 0.7, 1] }}
                  className="pointer-events-none absolute inset-x-0 top-1/3 text-center font-display text-5xl font-bold text-lime-strong drop-shadow-[0_6px_0_rgba(255,255,255,1)]"
                >
                  +{feedback.points}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Panel de feedback con mascota */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[28px] p-4 pr-5 ${isCorrect ? 'bg-lime' : 'bg-pink'}`}
          >
            <Blob
              color={isCorrect ? BLOB_COLORS.yellow : BLOB_COLORS.lavender}
              mood={isCorrect ? 'excited' : 'sad'}
              size={76}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1 basis-48">
              <p className="font-display text-lg font-bold">
                {feedback.kind === 'correct' && (
                  <>
                    {feedback.tierLabel} +{feedback.points} pts{' '}
                    <span className="text-lime-strong">×{feedback.multiplier}</span>
                    {feedback.streakBonus > 0 && (
                      <span className="text-peach-strong"> +{Math.round(feedback.streakBonus * 100)}% racha</span>
                    )}
                  </>
                )}
                {feedback.kind === 'wrong' && 'Ups, no era esa. La racha se reinicia.'}
                {feedback.kind === 'timeout' && '⏰ ¡Se acabó el tiempo!'}
              </p>
              <p className="mt-0.5 text-sm text-ink/70">{question.explanation}</p>
            </div>
            <Button variant="dark" size="sm" onClick={goNext} autoFocus className="w-full shrink-0 sm:w-auto">
              {isLast ? 'Resultados' : 'Siguiente'} →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
