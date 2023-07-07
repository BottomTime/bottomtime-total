import { mount } from '@vue/test-utils';

import MessageBox from '@/components/MessageBox.vue';
import { MessageBoxStyle } from '@/constants';

describe('MessageBox component', () => {
  it('Will render a message box with header', () => {
    const wrapper = mount(MessageBox, {
      props: {
        title: 'My Test Message',
      },
      slots: {
        default: '<p>This is some content</p>',
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  Object.entries(MessageBoxStyle).forEach(([key, style]) => {
    it(`Will apply style: ${key}`, () => {
      const wrapper = mount(MessageBox, {
        props: {
          title: 'My Test Message',
          style,
        },
        slots: {
          default: '<p>This is some content</p>',
        },
      });
      expect(wrapper.attributes().class).toContain(style);
    });
  });

  it('Will display close button if closeable property is set', async () => {
    const wrapper = mount(MessageBox, {
      props: {
        title: 'My Test Message',
        closeable: true,
      },
      slots: {
        default: '<p>This is some content</p>',
      },
    });
    await wrapper.get('button.delete').trigger('click');
    expect(wrapper.emitted().close).toEqual([[]]);
  });
});
