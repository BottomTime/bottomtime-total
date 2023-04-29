import { mount } from '@vue/test-utils';

import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';

describe('ConfirmDialog component', () => {
  it('Will not display when show is false', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {},
    });
    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('Will display correctly when shown', () => {
    const content = '<p>Content goes here</p>';
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
      slots: {
        default: content,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will display custom text', () => {
    const content = '<p>What do you think of this dialog?</p>';
    const confirmText = "It's dope!";
    const cancelText = "It's whack";
    const title = 'Fancy Title';
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        confirmText,
        cancelText,
        title,
      },
      slots: {
        default: content,
      },
    });
    expect(wrapper.get('p.modal-card-title').text()).toEqual(title);
    expect(wrapper.get('button.dialog-confirm').text()).toEqual(confirmText);
    expect(wrapper.get('button.dialog-cancel').text()).toEqual(cancelText);
  });
});
