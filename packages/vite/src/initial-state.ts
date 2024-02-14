import { AppInitialState } from './common';
import { Config } from './config';

export function useInitialState(): AppInitialState | null {
  if (Config.isSSR) return null;
  else return window.__INITIAL_STATE__;
}
