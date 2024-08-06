import { StateTree } from 'pinia';

declare global {
  interface Window {
    __INITIAL_STATE__: Record<string, StateTree>;
  }
}
