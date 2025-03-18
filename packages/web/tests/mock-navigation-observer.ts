import { CanNavigateGuard, INavigationObserver } from 'src/navigation-observer';
import { Router } from 'vue-router';

export class MockNavigationObserver implements INavigationObserver {
  readonly guards: CanNavigateGuard[] = [];
  allowNavigation: boolean | undefined;

  constructor(router: Router, allowNavigation?: boolean) {
    this.allowNavigation = allowNavigation;
    router.beforeEach(async (to, from, next): Promise<void> => {
      if (typeof this.allowNavigation === 'boolean') {
        next(this.allowNavigation);
        return;
      }

      let navigate = true;

      for (const guard of this.guards) {
        navigate = await guard(to, from);
        if (!navigate) break;
      }

      next(navigate);
    });
  }

  subscribe(guard: CanNavigateGuard) {
    this.guards.push(guard);
  }

  unsubscribe(guard: CanNavigateGuard) {
    const index = this.guards.indexOf(guard);
    if (index > -1) this.guards.splice(index, 1);
  }
}
