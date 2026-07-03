import { useCallback, useEffect, useMemo, useState } from 'react';
import { models, useLLM } from 'react-native-executorch';

import {
  BASE_SYSTEM_PROMPT,
  MAX_LOCAL_CONTEXT_MESSAGES,
  MAX_REMOTE_CONTEXT_MESSAGES,
} from '../constants/config';
import { getPersonalContext } from '../db/personalContext';
import { insertMessage, listMessages } from '../db/messages';
import { useConnectivity } from '../hooks/useConnectivity';
import { useSettings } from '../settings/SettingsContext';
import { chooseModel, RouterDecision } from './router';
import { callClaude } from './remoteModel';
import { ChatMessage } from './types';

export function useHybridChat() {
  const { apiKey, routerThreshold, remoteModel } = useSettings();
  const isOnline = useConnectivity();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [personalContext, setPersonalContextState] = useState('');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastDecision, setLastDecision] = useState<RouterDecision | null>(null);

  const llm = useLLM({ model: models.llm.llama3_2_3b() });

  // Load persisted history + personal context once on mount.
  useEffect(() => {
    (async () => {
      const [storedMessages, storedContext] = await Promise.all([
        listMessages(),
        getPersonalContext(),
      ]);
      setMessages(storedMessages);
      setPersonalContextState(storedContext);
      setIsHistoryLoaded(true);
    })();
  }, []);

  const combinedSystemPrompt = useMemo(() => {
    if (!personalContext.trim()) return BASE_SYSTEM_PROMPT;
    return `${BASE_SYSTEM_PROMPT}\n\nContexto personal del usuario (úsalo para personalizar tus respuestas):\n${personalContext.trim()}`;
  }, [personalContext]);

  // Keep the local model's system prompt in sync with the personal context file.
  useEffect(() => {
    if (!llm.isReady) return;
    llm.configure({ chatConfig: { systemPrompt: combinedSystemPrompt } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llm.isReady, combinedSystemPrompt]);

  const refreshPersonalContext = useCallback(async () => {
    const stored = await getPersonalContext();
    setPersonalContextState(stored);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setIsSending(true);
      const userMessage = await insertMessage('user', trimmed, null);
      setMessages((prev) => [...prev, userMessage]);

      const hasApiKey = Boolean(apiKey);
      let decision = chooseModel({
        text: trimmed,
        isOnline,
        hasApiKey,
        charThreshold: routerThreshold,
      });

      // The local model can take a while to download/load the first time.
      // Fall back to the remote API if it's picked but not ready yet.
      if (decision.model === 'local' && !llm.isReady && isOnline && hasApiKey) {
        decision = { model: 'remote', reason: 'Modelo local aún no está listo' };
      }
      setLastDecision(decision);

      try {
        let replyText: string;

        if (decision.model === 'local') {
          if (!llm.isReady) {
            throw new Error('El modelo local todavía se está descargando o cargando.');
          }
          const history = [...messages, userMessage]
            .slice(-MAX_LOCAL_CONTEXT_MESSAGES)
            .map((m) => ({ role: m.role, content: m.content }));
          replyText = await llm.generate([
            { role: 'system' as const, content: combinedSystemPrompt },
            ...history,
          ]);
        } else {
          if (!apiKey) {
            throw new Error('Configura tu API key de Anthropic en Ajustes.');
          }
          const history = [...messages, userMessage]
            .slice(-MAX_REMOTE_CONTEXT_MESSAGES)
            .map((m) => ({ role: m.role, content: m.content }));
          replyText = await callClaude({
            apiKey,
            model: remoteModel,
            systemPrompt: combinedSystemPrompt,
            messages: history,
          });
        }

        const assistantMessage = await insertMessage('assistant', replyText, decision.model);
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        const label = decision.model === 'local' ? 'modelo local' : 'Claude API';
        const assistantMessage = await insertMessage(
          'assistant',
          `⚠️ No se pudo generar una respuesta (${label}): ${message}`,
          decision.model
        );
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, isOnline, apiKey, routerThreshold, remoteModel, combinedSystemPrompt, llm]
  );

  return {
    messages,
    isHistoryLoaded,
    isSending,
    isOnline,
    lastDecision,
    sendMessage,
    localModel: {
      isReady: llm.isReady,
      downloadProgress: llm.downloadProgress,
      isGenerating: llm.isGenerating,
      response: llm.response,
      error: llm.error,
    },
    personalContext,
    refreshPersonalContext,
  };
}
