import { mount } from '@vue/test-utils';

import ConfirmDialog from '../../../../src/components/dialog/confirm-dialog.vue';

const Locators = {
  backdrop: '[data-testid="dialog-backdrop"]',
  closeButton: '[data-testid="dialog-close-button"]',
  confirmButton: '[data-testid="dialog-confirm-button"]',
  cancelButton: '[data-testid="dialog-cancel-button"]',
  dialogContent: '[data-testid="dialog-content"]',
  modal: '[data-testid="dialog-modal"]',
  title: '[data-testid="dialog-title"]',
} as const;

describe('Confirm Dialog', () => {
  it('should render correctly', () => {
    const title = 'Test Title';
    const confirmText = 'Do iiiit!';
    const cancelText = 'Noooo!';
    const dialogContent = '<p>Test Message</p>';
    const wrapper = mount(ConfirmDialog, {
      props: {
        title,
        confirmText,
        cancelText,
        visible: true,
      },
      slots: {
        default: dialogContent,
      },
    });

    expect(wrapper.find(Locators.backdrop).isVisible()).toBe(true);
    expect(wrapper.find(Locators.title).text()).toBe(title);
    expect(wrapper.find(Locators.closeButton).isVisible()).toBe(true);
    expect(wrapper.find(Locators.confirmButton).text()).toBe(confirmText);
    expect(wrapper.find(Locators.cancelButton).text()).toBe(cancelText);
    expect(wrapper.find(Locators.dialogContent).html()).toContain(
      dialogContent,
    );
  });

  it('will not render the dialog when visible is false', () => {
    const wrapper = mount(ConfirmDialog);
    expect(wrapper.find(Locators.modal).exists()).toBe(false);
    expect(wrapper.find(Locators.backdrop).exists()).toBe(false);
  });

  it('will emit cancel event when close button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
    });

    await wrapper.find(Locators.closeButton).trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('will emit cancel event when cancel button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
    });

    await wrapper.find(Locators.cancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('will emit cancel event when backdrop is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
    });

    await wrapper.find(Locators.backdrop).trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('will emit confirm event when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
      },
    });

    await wrapper.find(Locators.confirmButton).trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('will show the confirm button with danger colours if dangerous is true', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        dangerous: true,
      },
    });

    expect(wrapper.find(Locators.confirmButton).classes()).toContain(
      'from-danger-dark',
    );
  });
});
