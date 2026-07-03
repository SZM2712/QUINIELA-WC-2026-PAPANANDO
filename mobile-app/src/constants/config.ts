export const DEFAULT_ROUTER_CHAR_THRESHOLD = 280;

export const REMOTE_MODEL_OPTIONS = [
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (recomendado)' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (máxima calidad)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (rápido y económico)' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (versión anterior)' },
] as const;

export type RemoteModelId = (typeof REMOTE_MODEL_OPTIONS)[number]['id'];

export const DEFAULT_REMOTE_MODEL: RemoteModelId = 'claude-sonnet-5';

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';
export const ANTHROPIC_MAX_TOKENS = 2048;

export const BASE_SYSTEM_PROMPT =
  'Eres un asistente de IA útil, honesto y conciso, integrado en una app móvil híbrida que combina un modelo local en el dispositivo y la API de Claude. Responde en el idioma del usuario.';

export const MAX_LOCAL_CONTEXT_MESSAGES = 12;
export const MAX_REMOTE_CONTEXT_MESSAGES = 40;

export const SECURE_STORE_API_KEY_ALIAS = 'anthropic_api_key';

export const SETTINGS_KEYS = {
  routerThreshold: 'router_char_threshold',
  remoteModel: 'remote_model_id',
} as const;
