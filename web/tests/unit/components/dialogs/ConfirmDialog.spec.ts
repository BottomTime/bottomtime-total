import { mount } from '@vue/test-utils';

import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';

describe('ConfirmDialog component', () => {
  const content = '<p>Content goes here</p>';

  it('Will not display when show is false', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {},
    });
    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('Will display correctly when shown', () => {
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

  it('Will allow the dialog to be closed with confirm button', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
      slots: {
        default: content,
      },
    });
    await wrapper.get('button.dialog-confirm').trigger('click');
    expect(wrapper.emitted().confirm).toEqual([[]]);
  });

  it('Will allow the dialog to be closed with cancel button', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
      slots: {
        default: content,
      },
    });
    await wrapper.get('button.dialog-cancel').trigger('click');
    expect(wrapper.emitted().cancel).toEqual([[]]);
  });

  it('Will allow the dialog to be closed with close button', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
      slots: {
        default: content,
      },
    });
    await wrapper.get('button.delete').trigger('click');
    expect(wrapper.emitted().cancel).toEqual([[]]);
  });

  it('Will allow the dialog to be closed by clicking outside of it', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
      slots: {
        default: content,
      },
    });
    await wrapper.get('div.modal-background').trigger('click');
    expect(wrapper.emitted().cancel).toEqual([[]]);
  });
});
