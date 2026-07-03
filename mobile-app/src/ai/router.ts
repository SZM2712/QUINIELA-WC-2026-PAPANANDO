import { ModelSource } from './types';

const CODE_FENCE = /```/;

// Frases que delatan una tarea "pesada": análisis largo, documento adjunto o código.
const HEAVY_TASK_KEYWORDS = [
  'analiza',
  'analizar',
  'analiza este documento',
  'resume este documento',
  'resumen del documento',
  'revisa este código',
  'revisa el código',
  'code review',
  'refactoriza',
  'refactorizar',
  'debug',
  'depura',
  'documento adjunto',
  'explica este código',
  'genera un informe',
  'escribe un ensayo',
];

export interface RouterInput {
  text: string;
  isOnline: boolean;
  hasApiKey: boolean;
  charThreshold: number;
}

export interface RouterDecision {
  model: ModelSource;
  reason: string;
}

/**
 * Router por reglas: decide si un mensaje se resuelve con el modelo local
 * (rápido, privado, funciona offline) o con la API de Claude (más capaz,
 * mejor para análisis largos, documentos o código).
 */
export function chooseModel({
  text,
  isOnline,
  hasApiKey,
  charThreshold,
}: RouterInput): RouterDecision {
  if (!isOnline) {
    return { model: 'local', reason: 'Sin conexión a internet' };
  }
  if (!hasApiKey) {
    return { model: 'local', reason: 'No hay API key configurada' };
  }

  const trimmed = text.trim();

  if (trimmed.length > charThreshold) {
    return { model: 'remote', reason: `Mensaje largo (> ${charThreshold} caracteres)` };
  }

  if (CODE_FENCE.test(trimmed)) {
    return { model: 'remote', reason: 'Contiene un bloque de código' };
  }

  const lineCount = trimmed.split('\n').length;
  if (lineCount > 4) {
    return { model: 'remote', reason: 'Mensaje con múltiples líneas' };
  }

  const lower = trimmed.toLowerCase();
  const matchedKeyword = HEAVY_TASK_KEYWORDS.find((keyword) => lower.includes(keyword));
  if (matchedKeyword) {
    return { model: 'remote', reason: `Palabra clave de análisis: "${matchedKeyword}"` };
  }

  return { model: 'local', reason: 'Mensaje corto y simple' };
}
