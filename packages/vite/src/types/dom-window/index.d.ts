import { AppInitialState } from '../../common';

declare global {
  interface Window {
    __INITIAL_STATE__: AppInitialState;
  }
}
