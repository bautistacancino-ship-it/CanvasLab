'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { MeterGauge } from '@/components/hud/MeterGauge';
import { Blob } from '@/components/ui/Blob';
import { Button } from '@/components/ui/Button';
import { BLOB_COLORS } from '@/lib/tones';
import type {
  ChoiceQuality,
  MeterEffects,
  MeterKey,
  Meters,
  SimulationChoice,
  SimulationNode,
  VirtualClient,
} from '@/types/game';

interface DecisionSimulatorProps {
  client: VirtualClient;
  nodes: Record<string, SimulationNode>;
  startNodeId: string;
  /**
   * Punto de integración con el estado global. El padre decide qué hacer
   * (ej. `makeDecision` del store: aplica efectos a medidores + puntos).
   */
  onDecision: (choice: SimulationChoice, node: SimulationNode) => void;
  onComplete: () => void;
  /** Medidores actuales a mostrar en la cabecera del chat. */
  meters?: Meters;
  /** Pausa base de "escribiendo…" antes de cada mensaje del cliente. */
  typingDelayMs?: number;
}

/** Un paso del historial: el nodo visitado y (si ya respondió) la elección. */
interface Step {
  nodeId: string;
  choiceId?: string;
}

const METER_LABELS: Record<MeterKey, string> = {
  rentabilidad: 'Rentabilidad',
  reputacion: 'Reputación',
};

const QUALITY_STYLES: Record<ChoiceQuality, { box: string; title: string; blob: string; mood: 'excited' | 'thinking' | 'sad' }> = {
  good: { box: 'bg-lime', title: '¡Buena decisión!', blob: BLOB_COLORS.yellow, mood: 'excited' },
  neutral: { box: 'bg-sun', title: 'Decisión discutible', blob: BLOB_COLORS.sky, mood: 'thinking' },
  bad: { box: 'bg-pink', title: 'Decisión riesgosa', blob: BLOB_COLORS.lavender, mood: 'sad' },
};

export function DecisionSimulator({
  client,
  nodes,
  startNodeId,
  onDecision,
  onComplete,
  meters,
  typingDelayMs = 900,
}: DecisionSimulatorProps) {
  const [steps, setSteps] = useState<Step[]>([{ nodeId: startNodeId }]);
  /** Cuántos mensajes del nodo ACTUAL ya se mostraron. */
  const [revealed, setRevealed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = steps[steps.length - 1];
  const currentNode = nodes[current.nodeId];
  const currentChoice = currentNode.choices.find((c) => c.id === current.choiceId);
  const isTyping = revealed < currentNode.clientMessages.length;
  const isFinished = Boolean(currentChoice && currentChoice.next === null);
  const canChoose = !isTyping && !current.choiceId;

  // Revela los mensajes del cliente uno a uno, con delay proporcional al largo.
  useEffect(() => {
    if (!isTyping) return;
    const nextText = currentNode.clientMessages[revealed];
    const delay = typingDelayMs + Math.min(nextText.length * 15, 1400);
    const id = window.setTimeout(() => setRevealed((r) => r + 1), delay);
    return () => window.clearTimeout(id);
  }, [currentNode, isTyping, revealed, typingDelayMs]);

  // Autoscroll al último mensaje.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [steps, revealed]);

  const handleChoice = (choice: SimulationChoice) => {
    if (!canChoose) return;
    onDecision(choice, currentNode);
    setSteps((prev) => {
      const answered = [...prev.slice(0, -1), { ...current, choiceId: choice.id }];
      return choice.next ? [...answered, { nodeId: choice.next }] : answered;
    });
    if (choice.next) setRevealed(0);
  };

  return (
    <div className="mx-auto flex h-[min(760px,calc(100dvh-11rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-white shadow-float ring-1 ring-ink/5">
      {/* Cabecera tipo perfil */}
      <header className="relative bg-linear-to-b from-sky via-lavender to-white px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-3xl shadow-soft ring-4 ring-white">
            {client.avatar}
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-lime-strong ring-2 ring-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold leading-tight">{client.name}</p>
            <p className="truncate text-xs text-ink/60">
              {isTyping ? (
                <span className="font-semibold text-lime-strong">escribiendo…</span>
              ) : (
                `${client.role} · ${client.business}`
              )}
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-muted sm:block">
            📍 {client.location}
          </span>
        </div>
        {meters && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/90 px-3 py-2">
              <MeterGauge label="Rentabilidad" icon="💰" value={meters.rentabilidad} compact />
            </div>
            <div className="rounded-2xl bg-white/90 px-3 py-2">
              <MeterGauge label="Reputación" icon="⭐" value={meters.reputacion} compact />
            </div>
          </div>
        )}
      </header>

      {/* Conversación */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface px-4 py-5" aria-live="polite">
        <p className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-muted">Hoy</p>
        {steps.map((step, stepIndex) => {
          const node = nodes[step.nodeId];
          const isCurrent = stepIndex === steps.length - 1;
          const visibleMessages = isCurrent ? node.clientMessages.slice(0, revealed) : node.clientMessages;
          const choice = node.choices.find((c) => c.id === step.choiceId);

          return (
            <div key={`${step.nodeId}-${stepIndex}`} className="space-y-3">
              {visibleMessages.map((text, i) => (
                <ChatBubble key={i} author="client">
                  {text}
                </ChatBubble>
              ))}
              {choice && (
                <>
                  <ChatBubble author="player">{choice.text}</ChatBubble>
                  <DecisionFeedback choice={choice} />
                </>
              )}
            </div>
          );
        })}

        <AnimatePresence>{isTyping && <TypingIndicator key="typing" />}</AnimatePresence>
      </div>

      {/* Zona de respuestas */}
      <footer className="border-t border-line bg-white p-3">
        <AnimatePresence mode="wait">
          {canChoose && (
            <motion.div
              key={`choices-${current.nodeId}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="space-y-2"
            >
              <p className="px-2 text-xs font-bold uppercase tracking-widest text-muted">Elige tu respuesta</p>
              {currentNode.choices.map((choice, i) => (
                <motion.button
                  key={choice.id}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoice(choice)}
                  className="flex w-full items-center gap-3 rounded-[20px] bg-surface p-2 pr-4 text-left text-sm ring-1 ring-line transition hover:bg-white hover:ring-2 hover:ring-sky-strong/50"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white font-display font-bold text-sky-strong">
                    {i + 1}
                  </span>
                  {choice.text}
                </motion.button>
              ))}
            </motion.div>
          )}
          {isFinished && (
            <motion.div key="finish" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button variant="gradient" size="md" onClick={onComplete} className="w-full">
                Cerrar chat y construir mi Canvas →
              </Button>
            </motion.div>
          )}
          {isTyping && !isFinished && (
            <p key="wait" className="py-3 text-center text-sm text-muted">
              {client.name} está escribiendo…
            </p>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}

/* ─── Sub-componentes ─────────────────────────────────────────── */

function ChatBubble({ author, children }: { author: 'client' | 'player'; children: React.ReactNode }) {
  const isClient = author === 'client';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
    >
      <p
        className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${
          isClient
            ? 'rounded-bl-lg bg-white text-ink shadow-soft'
            : 'rounded-br-lg bg-linear-to-br from-sky-strong to-lavender-strong text-white shadow-[0_10px_20px_-12px_rgba(47,107,255,0.8)]'
        }`}
      >
        {children}
      </p>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex">
      <div className="flex gap-1 rounded-3xl rounded-bl-lg bg-white px-4 py-3.5 shadow-soft">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-lavender-strong/60"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function DecisionFeedback({ choice }: { choice: SimulationChoice }) {
  const style = QUALITY_STYLES[choice.quality];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25 }}
      className={`mx-auto flex max-w-[94%] gap-3 rounded-3xl p-3 pr-4 text-sm ${style.box}`}
    >
      <Blob color={style.blob} mood={style.mood} size={52} float={false} className="shrink-0" />
      <div className="min-w-0">
        <p className="font-display text-base font-bold">{style.title}</p>
        <p className="mt-0.5 text-ink/70">{choice.feedback}</p>
        {Object.keys(choice.effects).length > 0 && <EffectChips effects={choice.effects} />}
      </div>
    </motion.div>
  );
}

function EffectChips({ effects }: { effects: MeterEffects }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {(Object.entries(effects) as [MeterKey, number][]).map(([key, delta]) => (
        <span
          key={key}
          className={`rounded-full bg-white px-2.5 py-0.5 font-display text-xs font-semibold ${
            delta >= 0 ? 'text-lime-strong' : 'text-pink-strong'
          }`}
        >
          {METER_LABELS[key]} {delta > 0 ? `+${delta}` : delta}
        </span>
      ))}
    </div>
  );
}
