import { NavigationObserver } from 'src/navigation-observer';
import { createRouter } from 'tests/fixtures/create-router';
import { Router } from 'vue-router';

const FromUrl = '/from';
const ToUrl = '/to';

describe('NavigationObserver class', () => {
  let router: Router;
  let observer: NavigationObserver;

  beforeEach(async () => {
    router = createRouter([
      {
        path: FromUrl,
        component: { template: '<div>From</div>' },
      },
      {
        path: ToUrl,
        component: { template: '<div>To</div>' },
      },
    ]);
    observer = new NavigationObserver(router);
    await router.push(FromUrl);
  });

  it('will subscribe and invoke guards on navigation', async () => {
    const guards = [
      jest.fn().mockReturnValue(true),
      jest.fn().mockReturnValue(true),
      jest.fn().mockReturnValue(true),
    ];
    for (const guard of guards) {
      observer.subscribe(guard);
    }

    await expect(router.push(ToUrl)).resolves.toBeUndefined();
    for (const guard of guards) {
      expect(guard).toHaveBeenCalled();
    }
  });

  it('will subscribe and invoke async guards on navigation', async () => {
    const guards = [
      jest.fn().mockResolvedValue(true),
      jest.fn().mockResolvedValue(true),
      jest.fn().mockResolvedValue(true),
    ];
    for (const guard of guards) {
      observer.subscribe(guard);
    }

    await expect(router.push(ToUrl)).resolves.toBeUndefined();
    for (const guard of guards) {
      expect(guard).toHaveBeenCalled();
    }
  });

  it('will allow a guard to abort a navigation', async () => {
    const guards = [
      jest.fn().mockReturnValue(true),
      jest.fn().mockReturnValue(false),
      jest.fn().mockReturnValue(true),
    ];
    for (const guard of guards) {
      observer.subscribe(guard);
    }

    await expect(router.push(ToUrl)).resolves.toBeInstanceOf(Error);
    expect(guards[0]).toHaveBeenCalled();
    expect(guards[1]).toHaveBeenCalled();
    expect(guards[2]).not.toHaveBeenCalled();
  });

  it('will allow a guard to abort a navigation asynchronously', async () => {
    const guards = [
      jest.fn().mockResolvedValue(true),
      jest.fn().mockResolvedValue(false),
      jest.fn().mockResolvedValue(true),
    ];
    for (const guard of guards) {
      observer.subscribe(guard);
    }

    await expect(router.push(ToUrl)).resolves.toBeInstanceOf(Error);
    expect(guards[0]).toHaveBeenCalled();
    expect(guards[1]).toHaveBeenCalled();
    expect(guards[2]).not.toHaveBeenCalled();
  });

  it('will unsubscribe a guard', async () => {
    const guards = [
      jest.fn().mockReturnValue(true),
      jest.fn().mockReturnValue(true),
      jest.fn().mockReturnValue(true),
    ];
    for (const guard of guards) {
      observer.subscribe(guard);
    }

    observer.unsubscribe(guards[1]);

    await expect(router.push(ToUrl)).resolves.toBeUndefined();
    expect(guards[0]).toHaveBeenCalled();
    expect(guards[1]).not.toHaveBeenCalled();
    expect(guards[2]).toHaveBeenCalled();
  });

  it('will proceed with navigation if no guards are subscribed', async () => {
    await expect(router.push(ToUrl)).resolves.toBeUndefined();
  });
});
