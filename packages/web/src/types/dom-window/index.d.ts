import { AppInitialState } from '../../initial-state';

declare global {
  interface Window {
    __INITIAL_STATE__: AppInitialState;
  }
}
