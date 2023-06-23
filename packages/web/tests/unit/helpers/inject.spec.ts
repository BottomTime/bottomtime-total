import { inject as vueInject, InjectionKey } from 'vue';
import { inject } from '@/helpers';

jest.mock('vue');

class Wozzle {
  getWozzle(): string {
    return 'now wozzling...';
  }
}

const WozzleKey: InjectionKey<Wozzle> = Symbol('wozzle');

describe('inject Helper Function', () => {
  it('Will return a provided dependency', () => {
    const expected = new Wozzle();
    const spy = jest.mocked(vueInject).mockReturnValue(expected);

    const actual = inject(WozzleKey);
    expect(actual).toBe(expected);
    expect(spy).toBeCalledWith(WozzleKey);
  });

  it('Will throw an exception if the requested dependency was not provided', () => {
    const spy = jest.mocked(vueInject).mockReturnValue(undefined);
    expect(() => inject(WozzleKey)).toThrowErrorMatchingSnapshot();
    expect(spy).toBeCalledWith(WozzleKey);
  });
});
