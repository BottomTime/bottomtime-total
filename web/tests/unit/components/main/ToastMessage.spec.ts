import { mount } from '@vue/test-utils';

import ToastMessage from '@/components/main/ToastMessage.vue';
import { Toast, ToastType } from '@/helpers';
import { faker } from '@faker-js/faker';

describe('Toast Message', () => {
  it('Will render toast message', () => {
    const toast: Toast = {
      id: faker.datatype.uuid(),
      message: 'Hi! I am a toast',
      description: 'I have a description too.',
      type: ToastType.Success,
    };
    const wrapper = mount(ToastMessage, {
      props: { toast },
    });

    const mainDiv = wrapper.find(`div#toast-${toast.id}`);
    expect(mainDiv.exists()).toBe(true);

    const divs = mainDiv.findAll('div');
    expect(divs).toHaveLength(2);
    expect(divs.at(0)?.text()).toContain(toast.message);
    expect(divs.at(1)?.text()).toContain(toast.description);
  });

  it('Will render without description if one is not provided in toast', () => {
    const toast: Toast = {
      id: faker.datatype.uuid(),
      message: 'Hi! I am a toast without a description',
      type: ToastType.Success,
    };
    const wrapper = mount(ToastMessage, {
      props: { toast },
    });

    const mainDiv = wrapper.find(`div#toast-${toast.id}`);
    expect(mainDiv.exists()).toBe(true);

    const divs = mainDiv.findAll('div');
    expect(divs).toHaveLength(1);
    expect(divs.at(0)?.text()).toContain(toast.message);
  });

  Object.keys(ToastType).forEach((toastType) => {
    it(`Will show correct style based on message type: ${toastType}`, () => {
      const toast: Toast = {
        id: faker.datatype.uuid(),
        message: 'Check out my style!',
        type: toastType,
      };
      const wrapper = mount(ToastMessage, {
        props: { toast },
      });
      expect(wrapper.find(`div#toast-${toast.id}.${toastType}`).exists()).toBe(
        true,
      );
    });
  });

  it('Will fire dismiss event if close button is clicked', async () => {
    const toast: Toast = {
      id: faker.datatype.uuid(),
      message: 'Dismiss me!',
      type: ToastType.Info,
    };
    const wrapper = mount(ToastMessage, {
      props: { toast },
    });
    await wrapper.find(`button#btn-dismiss-toast-${toast.id}`).trigger('click');
    expect(wrapper.emitted('close')).toEqual([[toast.id]]);
  });
});
