import { flushPromises, mount } from '@vue/test-utils';

import CopyButton from '../../../../src/components/common/copy-button.vue';

describe('CopyButton copmonent', () => {
  let oldClipboard: Clipboard;
  let writeText: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['setImmediate', 'nextTick'],
    });
    oldClipboard = globalThis.navigator.clipboard;
    writeText = jest.fn();

    Object.assign(globalThis.navigator, {
      clipboard: {
        writeText,
      },
    });
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
    Object.assign(globalThis.navigator, { clipboard: oldClipboard });
  });

  it('will do nothing if no value is provided', async () => {
    const wrapper = mount(CopyButton);
    await wrapper.get('button').trigger('click');

    expect(writeText).not.toHaveBeenCalled();
    expect(wrapper.emitted('copied')).toBeUndefined();
  });

  it('will copy the value to the clipboard and emit the "copied" event', async () => {
    const value = 'copy me!';
    const wrapper = mount(CopyButton, { props: { value } });
    await wrapper.get('button').trigger('click');

    expect(writeText).toHaveBeenCalledWith(value);
    expect(wrapper.emitted('copied')).toEqual([[value]]);
  });

  it('will show notification when the value is copied (and hide it after a couple of seconds!)', async () => {
    const value = 'copy me!';
    const wrapper = mount(CopyButton, { props: { value } });
    await wrapper.get('button').trigger('click');

    expect(wrapper.find('span').classes().includes('opacity-100')).toBe(true);
    expect(wrapper.find('span').classes().includes('opacity-0')).toBe(false);
    jest.runAllTimers();
    await flushPromises();
    expect(wrapper.find('span').classes().includes('opacity-100')).toBe(false);
    expect(wrapper.find('span').classes().includes('opacity-0')).toBe(true);
  });

  ['top', 'bottom', 'left', 'right'].forEach((position) => {
    it(`will show the notification at the ${position} of the button`, async () => {
      const value = 'copy me!';
      const wrapper = mount(CopyButton, {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        props: { value, tooltipPosition: position as any },
      });
      await wrapper.get('button').trigger('click');
      expect(wrapper.find('span').classes().join(' ')).toMatchSnapshot();
    });
  });
});
