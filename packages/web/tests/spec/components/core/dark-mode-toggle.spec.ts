import { mount } from '@vue/test-utils';

import DarkModeToggle from '../../../../src/components/core/dark-mode-toggle.vue';

describe('Dark Mode Toggle component', () => {
  afterEach(() => {
    localStorage.removeItem('darkMode');
  });

  it('will initialize in dark mode', () => {
    localStorage.setItem('darkMode', 'true');
    const wrapper = mount(DarkModeToggle);
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true);
  });

  it('will initialize in light mode', () => {
    localStorage.setItem('darkMode', 'false');
    const wrapper = mount(DarkModeToggle);
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(false);
  });

  [true, false].forEach((darkMode) => {
    it('will default to system preference (dark mode) if local storage is not set', () => {
      localStorage.removeItem('darkMode');
      const spy = jest.fn().mockReturnValue({ matches: darkMode });
      window.matchMedia = spy;

      const wrapper = mount(DarkModeToggle);
      expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(
        darkMode,
      );
      expect(spy).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });
});
