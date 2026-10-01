/* ──────────────────────────────────────────────────────────────
 * Tipos de dominio del juego. Todo el contenido (niveles, quiz,
 * simulaciones) es data pura tipada con estas interfaces, de modo
 * que agregar un nivel nuevo = agregar un archivo en /data/levels.
 * ────────────────────────────────────────────────────────────── */

/** Los 9 bloques del Business Model Canvas (también son los slugs de URL). */
export const CANVAS_BLOCK_IDS = [
  'customer-segments',
  'value-propositions',
  'channels',
  'customer-relationships',
  'revenue-streams',
  'key-resources',
  'key-activities',
  'key-partners',
  'cost-structure',
] as const;

export type CanvasBlockId = (typeof CANVAS_BLOCK_IDS)[number];

export const isCanvasBlockId = (value: string): value is CanvasBlockId =>
  (CANVAS_BLOCK_IDS as readonly string[]).includes(value);

export type BusinessId = 'agencia-marketing' | 'estudio-animacion' | 'branding-estudio';

export interface CoreBusiness {
  id: BusinessId;
  name: string;
  tagline: string;
  emoji: string;
  /** Si es false, el negocio aparece pero aún no tiene contenido. */
  available: boolean;
}

/* ─── Fases de un nivel ───────────────────────────────────────── */

export const LEVEL_PHASES = ['theory', 'quiz', 'simulation', 'build'] as const;
export type LevelPhase = (typeof LEVEL_PHASES)[number];
export type BlockPhase = LevelPhase | 'done';

/* ─── Medidores ───────────────────────────────────────────────── */

export type MeterKey = 'rentabilidad' | 'reputacion';
export type Meters = Record<MeterKey, number>;
export type MeterEffects = Partial<Meters>;

/* ─── Fase 1: Teoría ──────────────────────────────────────────── */

export interface TheoryCard {
  id: string;
  icon: string;
  title: string;
  body: string;
  /** Reverso de la tarjeta: ejemplo aterrizado al Core Business. */
  example: string;
}

/* ─── Fase 2: Quiz ────────────────────────────────────────────── */

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizConfig {
  timeLimitSec: number;
  basePoints: number;
  questions: QuizQuestion[];
}

export interface QuizResult {
  correct: number;
  total: number;
  points: number;
  bestMultiplier: number;
}

/* ─── Fase 3: Simulación (árbol de decisiones) ────────────────── */

export type ChoiceQuality = 'good' | 'neutral' | 'bad';

export interface SimulationChoice {
  id: string;
  text: string;
  quality: ChoiceQuality;
  effects: MeterEffects;
  /** Lo que aprende el alumno tras elegir (mensaje del "mentor"). */
  feedback: string;
  /** Id del siguiente nodo, o null si la conversación termina. */
  next: string | null;
}

export interface SimulationNode {
  id: string;
  clientMessages: string[];
  choices: SimulationChoice[];
}

export interface VirtualClient {
  name: string;
  role: string;
  business: string;
  location: string;
  avatar: string;
}

export interface SimulationConfig {
  client: VirtualClient;
  startNodeId: string;
  nodes: Record<string, SimulationNode>;
}

export interface DecisionRecord {
  nodeId: string;
  choiceId: string;
  quality: ChoiceQuality;
}

/* ─── Fase 4: Construcción del Canvas ─────────────────────────── */

export interface BuildField {
  id: string;
  label: string;
  helper: string;
  placeholder?: string;
  kind: 'textarea' | 'select';
  options?: string[];
  /** Largo mínimo para textarea (fomenta respuestas pensadas). */
  minLength?: number;
}

export interface BuildConfig {
  intro: string;
  fields: BuildField[];
}

/** Respuestas de un bloque: fieldId → texto. */
export type CanvasEntry = Record<string, string>;

/* ─── Nivel completo ──────────────────────────────────────────── */

export interface LevelConfig {
  id: string;
  businessId: BusinessId;
  blockId: CanvasBlockId;
  title: string;
  subtitle: string;
  theory: TheoryCard[];
  quiz: QuizConfig;
  simulation: SimulationConfig;
  build: BuildConfig;
}

/* ─── Progreso del jugador ────────────────────────────────────── */

export interface PlayerProfile {
  playerName: string;
  businessId: BusinessId;
  startedAt: string;
}

export interface BlockProgress {
  phase: BlockPhase;
  quiz?: QuizResult;
  decisions: DecisionRecord[];
  completedAt?: string;
}
