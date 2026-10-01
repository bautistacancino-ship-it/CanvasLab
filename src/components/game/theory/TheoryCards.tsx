'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Blob } from '@/components/ui/Blob';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { BLOB_COLORS, TONES, toneAt } from '@/lib/tones';
import type { TheoryCard } from '@/types/game';

const BLOB_CYCLE = [BLOB_COLORS.lavender, BLOB_COLORS.yellow, BLOB_COLORS.pink, BLOB_COLORS.sky];

interface TheoryCardsProps {
  cards: TheoryCard[];
  onComplete: () => void;
}

/** Tarjetas que se voltean: frente = concepto, reverso = ejemplo aplicado al negocio. */
export function TheoryCards({ cards, onComplete }: TheoryCardsProps) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const allSeen = seen.size === cards.length;

  const toggle = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSeen((prev) => new Set(prev).add(id));
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted">Toca cada tarjeta para ver cómo se aplica a tu negocio.</p>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 font-display text-sm font-semibold shadow-soft ring-1 ring-ink/5">
          {seen.size}/{cards.length} 👀
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, i) => {
          const isFlipped = flipped.has(card.id);
          const tone = toneAt(i);
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => toggle(card.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="h-64 text-left"
              style={{ perspective: 1000 }}
              aria-pressed={isFlipped}
            >
              <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                {/* Frente */}
                <div
                  className={`absolute inset-0 flex flex-col rounded-[28px] p-5 shadow-soft ring-1 ring-ink/5 ${TONES[tone].soft}`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex items-start justify-between">
                    <IconTile icon={card.icon} tone={tone} size="md" className="bg-white!" />
                    {seen.has(card.id) && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-lime-strong">✓ Vista</span>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{card.body}</p>
                  <span className={`mt-auto font-display text-sm font-semibold ${TONES[tone].text}`}>
                    Ver ejemplo ↻
                  </span>
                </div>

                {/* Reverso */}
                <div
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] bg-white p-5 shadow-soft ring-2 ring-lavender-strong/20"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className={`self-start rounded-full px-3 py-1 text-xs font-bold ${TONES[tone].soft} ${TONES[tone].text}`}>
                    En tu agencia
                  </span>
                  <p className="mt-3 pr-10 text-base font-medium leading-relaxed">{card.example}</p>
                  <Blob
                    color={BLOB_CYCLE[i % BLOB_CYCLE.length]}
                    mood="happy"
                    size={78}
                    float={false}
                    className="absolute -bottom-3 -right-3"
                  />
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="gradient" size="lg" disabled={!allSeen} onClick={onComplete}>
          {allSeen ? '¡Listo! Ir al quiz ⚡' : 'Revisa todas las tarjetas'}
        </Button>
      </div>
    </div>
  );
}
