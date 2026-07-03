import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_REMOTE_MODEL,
  DEFAULT_ROUTER_CHAR_THRESHOLD,
  RemoteModelId,
  SECURE_STORE_API_KEY_ALIAS,
  SETTINGS_KEYS,
} from '../constants/config';
import { getSetting, setSetting } from '../db/settingsStore';

interface SettingsState {
  isLoaded: boolean;
  apiKey: string | null;
  routerThreshold: number;
  remoteModel: RemoteModelId | string;
  setApiKey: (key: string) => Promise<void>;
  setRouterThreshold: (value: number) => Promise<void>;
  setRemoteModel: (modelId: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [routerThreshold, setRouterThresholdState] = useState(DEFAULT_ROUTER_CHAR_THRESHOLD);
  const [remoteModel, setRemoteModelState] = useState<string>(DEFAULT_REMOTE_MODEL);

  useEffect(() => {
    (async () => {
      const [storedKey, storedThreshold, storedModel] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_API_KEY_ALIAS),
        getSetting(SETTINGS_KEYS.routerThreshold),
        getSetting(SETTINGS_KEYS.remoteModel),
      ]);
      setApiKeyState(storedKey);
      if (storedThreshold) setRouterThresholdState(Number(storedThreshold));
      if (storedModel) setRemoteModelState(storedModel);
      setIsLoaded(true);
    })();
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    if (trimmed.length === 0) {
      await SecureStore.deleteItemAsync(SECURE_STORE_API_KEY_ALIAS);
      setApiKeyState(null);
      return;
    }
    await SecureStore.setItemAsync(SECURE_STORE_API_KEY_ALIAS, trimmed);
    setApiKeyState(trimmed);
  }, []);

  const setRouterThreshold = useCallback(async (value: number) => {
    await setSetting(SETTINGS_KEYS.routerThreshold, String(value));
    setRouterThresholdState(value);
  }, []);

  const setRemoteModel = useCallback(async (modelId: string) => {
    await setSetting(SETTINGS_KEYS.remoteModel, modelId);
    setRemoteModelState(modelId);
  }, []);

  const value = useMemo<SettingsState>(
    () => ({
      isLoaded,
      apiKey,
      routerThreshold,
      remoteModel,
      setApiKey,
      setRouterThreshold,
      setRemoteModel,
    }),
    [isLoaded, apiKey, routerThreshold, remoteModel, setApiKey, setRouterThreshold, setRemoteModel]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
