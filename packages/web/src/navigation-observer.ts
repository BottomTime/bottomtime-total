import { InjectionKey, inject } from 'vue';
import { RouteLocationNormalized, Router } from 'vue-router';

import { useLogger } from './logger';

const log = useLogger('NavigationObserver');

export type CanNavigateGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) => boolean | Promise<boolean>;

export interface INavigationObserver {
  subscribe: (guard: CanNavigateGuard) => void;
  unsubscribe: (guard: CanNavigateGuard) => void;
}

export const NavigationObserverKey: InjectionKey<INavigationObserver> =
  Symbol('NavigationObserver');

export class NavigationObserver implements INavigationObserver {
  private readonly guards: CanNavigateGuard[] = [];

  private async canNavigate(
    this: NavigationObserver,
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: (canNavigate: boolean) => void,
  ): Promise<void> {
    if (this.guards.length === 0) {
      next(true);
      return;
    }

    log.debug(
      'Attempting to navigate from',
      from.fullPath,
      'to',
      to.fullPath,
      'using',
      this.guards.length,
      'navigation guards...',
    );
    let canNavigate = true;

    for (const guard of this.guards) {
      canNavigate = await guard(to, from);
      if (!canNavigate) break;
    }

    log.debug('Navigation guards passed.');
    next(canNavigate);
  }

  constructor(router: Router) {
    router.beforeEach(this.canNavigate.bind(this));
  }

  subscribe(guard: CanNavigateGuard) {
    log.debug('Subscribing to navigation guard');
    this.guards.push(guard);
  }

  unsubscribe(guard: CanNavigateGuard) {
    const index = this.guards.indexOf(guard);
    if (index > -1) this.guards.splice(index, 1);
  }
}

export function useNavigationObserver(): INavigationObserver {
  const observer = inject(NavigationObserverKey);

  if (!observer) {
    throw new Error(
      'NavigationObserver has not been provided. Did you remember to call `app.provide()`?',
    );
  }

  return observer;
}
