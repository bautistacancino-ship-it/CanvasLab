import type { LevelConfig } from '@/types/game';

/* ──────────────────────────────────────────────────────────────
 * NIVEL 1 · Segmentos de Clientes
 * Core Business: Agencia de Marketing Digital y Desarrollo Web
 * Cliente virtual: clínica dental en Machalí que necesita
 * digitalizar su agendamiento.
 * ────────────────────────────────────────────────────────────── */

export const agenciaSegmentosClientes = {
  id: 'agencia-marketing/customer-segments',
  businessId: 'agencia-marketing',
  blockId: 'customer-segments',
  title: 'Segmentos de Clientes',
  subtitle: 'Si le vendes a todos, no le vendes a nadie.',

  /* ─── Fase 1 · Teoría visual ─────────────────────────────── */
  theory: [
    {
      id: 't1',
      icon: '🎯',
      title: '¿Qué es un segmento?',
      body: 'Un grupo de personas u organizaciones con necesidades, comportamientos y capacidad de pago similares, a las que decides servir.',
      example:
        'No es "pymes". Es "clínicas y centros de salud de 1 a 10 profesionales en la Región de O’Higgins que agendan por WhatsApp".',
    },
    {
      id: 't2',
      icon: '🧩',
      title: 'Tipos de mercado',
      body: 'Masivo, nicho, segmentado, diversificado o plataforma multilateral. Cada uno cambia cómo vendes, cobras y comunicas.',
      example:
        'Una agencia que solo hace web + agenda para salud trabaja un NICHO. Si además atiende inmobiliarias con otra oferta, es DIVERSIFICADA.',
    },
    {
      id: 't3',
      icon: '😣',
      title: 'Dolores y trabajos',
      body: 'Segmentas por el problema que tienen, no solo por su rubro. Un mismo dolor une a clientes de distintos rubros.',
      example:
        'Dentistas, kinesiólogos y peluquerías comparten el dolor de las horas perdidas por inasistencia. Ese dolor es tu puerta de entrada.',
    },
    {
      id: 't4',
      icon: '💸',
      title: 'Capacidad de pago',
      body: 'Un segmento atractivo no solo te necesita: puede pagarte de forma sostenible y te deja margen.',
      example:
        'Una clínica pequeña puede no pagar $3 millones por una app, pero sí $35.000 mensuales por un servicio que le recupera horas.',
    },
  ],

  /* ─── Fase 2 · Quiz de urgencia ──────────────────────────── */
  quiz: {
    timeLimitSec: 15,
    basePoints: 50,
    questions: [
      {
        id: 'q1',
        prompt: '¿Cuál es el segmento MEJOR definido para tu agencia?',
        options: [
          { id: 'a', text: 'Empresas que necesiten marketing' },
          { id: 'b', text: 'Clínicas dentales de 1–5 sillones en Rancagua y Machalí que agendan por WhatsApp' },
          { id: 'c', text: 'Todo Chile, porque internet no tiene fronteras' },
          { id: 'd', text: 'Personas de 25 a 45 años' },
        ],
        correctOptionId: 'b',
        explanation: 'Un buen segmento combina rubro, tamaño, ubicación y un comportamiento o dolor concreto.',
      },
      {
        id: 'q2',
        prompt: 'Tu agencia solo atiende centros de salud con una oferta especializada. ¿Qué tipo de mercado es?',
        options: [
          { id: 'a', text: 'Mercado masivo' },
          { id: 'b', text: 'Plataforma multilateral' },
          { id: 'c', text: 'Nicho de mercado' },
          { id: 'd', text: 'Diversificado' },
        ],
        correctOptionId: 'c',
        explanation: 'Nicho: un segmento específico con necesidades especializadas y una oferta hecha a su medida.',
      },
      {
        id: 'q3',
        prompt: '¿Qué dato te ayuda MÁS a decidir si un segmento vale la pena?',
        options: [
          { id: 'a', text: 'Si te cae bien el rubro' },
          { id: 'b', text: 'Su dolor principal y cuánto les cuesta no resolverlo' },
          { id: 'c', text: 'Cuántos seguidores tienen en Instagram' },
          { id: 'd', text: 'El color de su logo' },
        ],
        correctOptionId: 'b',
        explanation: 'Si el dolor les cuesta dinero (ej. horas perdidas), hay disposición real a pagar por la solución.',
      },
      {
        id: 'q4',
        prompt: 'Una plataforma de agendamiento que cobra a clínicas y es gratis para pacientes es un ejemplo de…',
        options: [
          { id: 'a', text: 'Plataforma multilateral' },
          { id: 'b', text: 'Mercado masivo' },
          { id: 'c', text: 'Nicho' },
          { id: 'd', text: 'Segmentado' },
        ],
        correctOptionId: 'a',
        explanation: 'Sirve a dos segmentos interdependientes: sin pacientes no hay valor para las clínicas, y viceversa.',
      },
      {
        id: 'q5',
        prompt: '¿Qué error es más común al definir segmentos en una agencia creativa?',
        options: [
          { id: 'a', text: 'Definir uno demasiado específico' },
          { id: 'b', text: 'Preguntar al cliente por sus problemas' },
          { id: 'c', text: 'Querer atender a "cualquiera que pague"' },
          { id: 'd', text: 'Revisar la competencia' },
        ],
        correctOptionId: 'c',
        explanation: '"Cualquiera que pague" lleva a ofertas genéricas, precios bajos y procesos imposibles de estandarizar.',
      },
    ],
  },

  /* ─── Fase 3 · Simulación de decisiones ──────────────────── */
  simulation: {
    client: {
      name: 'Dra. Valentina Rojas',
      role: 'Directora',
      business: 'Clínica Dental Sonríe Machalí',
      location: 'Av. San Juan, Machalí · O’Higgins',
      avatar: '🦷',
    },
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        clientMessages: [
          '¡Hola! Vi su Instagram y me recomendaron su agencia 😊',
          'Tenemos una clínica dental en Machalí con 3 sillones. Agendamos todo por WhatsApp y teléfono, y la recepcionista no da abasto.',
          'Perdemos casi un 20 % de las horas porque los pacientes no llegan. Somos chicos… ¿ustedes trabajan con clínicas como la nuestra?',
        ],
        choices: [
          {
            id: 'intro-any',
            text: '¡Claro! Trabajamos con cualquier empresa, grande o chica, del rubro que sea.',
            quality: 'bad',
            effects: { reputacion: -5, rentabilidad: -5 },
            feedback:
              'Sonar a "hacemos de todo" te quita autoridad. La Dra. no sabe si entiendes su problema específico.',
            next: 'pacientes',
          },
          {
            id: 'intro-niche',
            text: 'Justamente nos especializamos en centros de salud pequeños de O’Higgins. Cuénteme, ¿quiénes son sus pacientes?',
            quality: 'good',
            effects: { reputacion: 10, rentabilidad: 5 },
            feedback:
              '¡Bien! Declaraste tu nicho y pasaste a descubrir el segmento de TU cliente. Especializarte genera confianza.',
            next: 'pacientes',
          },
          {
            id: 'intro-prices',
            text: 'Le envío nuestra lista de precios de sitios web completos.',
            quality: 'bad',
            effects: { reputacion: -10 },
            feedback:
              'Saltaste directo a vender sin entender su necesidad. Ella no pidió un sitio web: pidió resolver inasistencias.',
            next: 'pacientes',
          },
        ],
      },
      pacientes: {
        id: 'pacientes',
        clientMessages: [
          'Mire, la mayoría son familias de Machalí y Rancagua.',
          'Tenemos muchos trabajadores de El Teniente con turnos 7×7. Se quejan de que nunca pueden llamar en horario de oficina 😩',
          'Y también adultos mayores con convenio, que prefieren que les confirmen la hora por teléfono.',
        ],
        choices: [
          {
            id: 'pac-24-7',
            text: 'Entonces un agendamiento online 24/7 con recordatorios automáticos por WhatsApp resolvería el dolor de los pacientes con turnos.',
            quality: 'good',
            effects: { reputacion: 10, rentabilidad: 5 },
            feedback:
              'Conectaste un segmento (mineros con turnos) con su dolor (horario) y una solución concreta. Eso es pensar en segmentos.',
            next: 'presupuesto',
          },
          {
            id: 'pac-national',
            text: 'Hagamos una campaña en Meta Ads para todo Chile y así llegan más pacientes.',
            quality: 'bad',
            effects: { rentabilidad: -10, reputacion: -5 },
            feedback:
              'Una clínica local no atiende a todo Chile: estarías quemando su presupuesto en personas que nunca irán a Machalí.',
            next: 'presupuesto',
          },
          {
            id: 'pac-app',
            text: 'Lo ideal sería desarrollarles una app nativa a medida para iOS y Android.',
            quality: 'neutral',
            effects: { rentabilidad: -10 },
            feedback:
              'Técnicamente resuelve, pero es una solución sobredimensionada para su tamaño. ¿Los adultos mayores descargarían una app?',
            next: 'presupuesto',
          },
        ],
      },
      presupuesto: {
        id: 'presupuesto',
        clientMessages: [
          'Me gusta cómo suena. Pero le soy honesta: el presupuesto es acotado.',
          'Podríamos invertir unos $400.000 al inicio. ¿Qué me propone?',
        ],
        choices: [
          {
            id: 'pres-plan',
            text: 'Implementamos una plataforma de agenda existente + landing optimizada por $380.000, y un plan mensual de $35.000 con recordatorios y soporte.',
            quality: 'good',
            effects: { rentabilidad: 15, reputacion: 10 },
            feedback:
              '¡Excelente! Ajustaste la oferta a la capacidad de pago del segmento y creaste ingreso recurrente. Esta solución la puedes replicar en otras clínicas.',
            next: null,
          },
          {
            id: 'pres-custom',
            text: 'Por $400.000 le hago todo a medida: sistema propio, web y app.',
            quality: 'bad',
            effects: { rentabilidad: -20, reputacion: 5 },
            feedback:
              'La clínica queda feliz… pero trabajaste meses a pérdida. Un segmento que no puede pagar tu solución a medida necesita otra oferta.',
            next: null,
          },
          {
            id: 'pres-reject',
            text: 'Con ese presupuesto lamentablemente no trabajamos.',
            quality: 'neutral',
            effects: { reputacion: -10 },
            feedback:
              'Proteges tu margen, pero pierdes un segmento con un dolor real y potencial de recurrencia. ¿Había una oferta más simple?',
            next: null,
          },
        ],
      },
    },
  },

  /* ─── Fase 4 · Construcción del Canvas ───────────────────── */
  build: {
    intro:
      'Con lo que aprendiste de la Dra. Rojas, define los segmentos de clientes de TU agencia. Esto quedará en tu Canvas.',
    fields: [
      {
        id: 'primary',
        label: 'Segmento principal',
        helper: 'Rubro + tamaño + ubicación + comportamiento.',
        placeholder: 'Ej: Clínicas de salud de 1 a 10 profesionales en Rancagua y Machalí que agendan por WhatsApp…',
        kind: 'textarea',
        minLength: 40,
      },
      {
        id: 'pain',
        label: 'Dolor principal del segmento',
        helper: '¿Qué problema les cuesta tiempo o dinero hoy?',
        placeholder: 'Ej: Pierden hasta un 20 % de las horas por inasistencias y la recepción está colapsada…',
        kind: 'textarea',
        minLength: 30,
      },
      {
        id: 'marketType',
        label: 'Tipo de mercado',
        helper: '¿Cómo se relaciona tu agencia con sus segmentos?',
        kind: 'select',
        options: ['Nicho', 'Segmentado', 'Diversificado', 'Mercado masivo', 'Plataforma multilateral'],
      },
      {
        id: 'secondary',
        label: 'Segmento secundario (opcional pero recomendado)',
        helper: 'Otro grupo que comparta el mismo dolor.',
        placeholder: 'Ej: Centros de kinesiología y estética de la región con el mismo problema de agenda…',
        kind: 'textarea',
        minLength: 0,
      },
    ],
  },
} satisfies LevelConfig;
