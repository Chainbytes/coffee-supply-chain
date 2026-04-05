import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getFarms, DEFAULT_FARM_ID, type Farm } from '../api';

interface FarmContextValue {
  farms: Farm[];
  activeFarm: Farm | null;
  setActiveFarmId: (id: string) => void;
  loading: boolean;
  error: string | null;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarmId, setActiveFarmId] = useState<string>(
    () => localStorage.getItem('activeFarmId') ?? DEFAULT_FARM_ID
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFarms()
      .then((list) => {
        setFarms(list);
        if (!activeFarmId && list.length > 0) {
          setActiveFarmId(list[0].id);
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load farms')
      )
      .finally(() => setLoading(false));
  }, [activeFarmId]);

  const handleSetActiveFarmId = (id: string) => {
    localStorage.setItem('activeFarmId', id);
    setActiveFarmId(id);
  };

  const activeFarm = farms.find((f) => f.id === activeFarmId) ?? farms[0] ?? null;

  return (
    <FarmContext.Provider
      value={{
        farms,
        activeFarm,
        setActiveFarmId: handleSetActiveFarmId,
        loading,
        error,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm(): FarmContextValue {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used inside FarmProvider');
  return ctx;
}
