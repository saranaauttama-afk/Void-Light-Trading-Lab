import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'void-light:api-base-url';

// There is no correct default here — "localhost" on a phone means the
// phone itself, not the computer running the server. The user must set
// this to their computer's LAN IP (e.g. http://192.168.1.23:8787) or a
// Tailscale address the first time they open the app.
const FALLBACK_BASE_URL = 'http://192.168.1.100:8787';

type ApiConfigContextValue = {
  baseUrl: string;
  setBaseUrl: (url: string) => Promise<void>;
  loaded: boolean;
};

const ApiConfigContext = createContext<ApiConfigContextValue | null>(null);

export function ApiConfigProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(FALLBACK_BASE_URL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setBaseUrlState(saved);
      setLoaded(true);
    });
  }, []);

  const setBaseUrl = useCallback(async (url: string) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    setBaseUrlState(trimmed);
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  }, []);

  return (
    <ApiConfigContext.Provider value={{ baseUrl, setBaseUrl, loaded }}>{children}</ApiConfigContext.Provider>
  );
}

export function useApiConfig() {
  const ctx = useContext(ApiConfigContext);
  if (!ctx) throw new Error('useApiConfig must be used inside ApiConfigProvider');
  return ctx;
}
