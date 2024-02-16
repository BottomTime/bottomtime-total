import { AppInitialState } from './common';

export function useInitialState(): AppInitialState | null {
  if (typeof window === 'undefined') return null;
  else return window.__INITIAL_STATE__;
}
