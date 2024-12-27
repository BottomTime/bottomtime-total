import { AlertDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';

import EditAlert from '../../../../src/components/admin/edit-alert.vue';
import FormDatePicker from '../../../../src/components/common/form-date-picker.vue';

const DateTimeFormat = 'YYYY-MMM-DD hh:mm:ss A';
const TestAlertData: AlertDTO = {
  id: '06b80fea-6ba2-462c-b838-56c59d7c1e42',
  icon: '',
  title: 'Test Alert',
  message: 'This is a test alert',
  active: new Date('2024-04-02T09:56:27.566Z').valueOf(),
  expires: new Date('2024-05-02T09:56:27.566Z').valueOf(),
};

const BlankAlertData: AlertDTO = {
  id: '',
  icon: '',
  title: '',
  message: '',
  active: undefined,
  expires: undefined,
};

const TitleInput = 'input[data-testid="title"]';
const MessageInput = 'textarea[data-testid="message"]';
const ActiveInput = 'input#dp-input-active';
const ExpiresInput = 'input#dp-input-expires';

const TitleError = 'span[data-testid="title-error"]';
const MessageError = 'p[data-testid="message-error"]';
const ExpiresError = 'span[data-testid="expires-error"]';

const SaveButton = 'button[data-testid="btn-save"]';
const CancelEditButton = 'button[data-testid="btn-cancel-edit"]';
const CancelNewButton = 'button[data-testid="btn-cancel-new"]';

describe('Edit Alert form component', () => {
  function getMountOptions(
    alert?: Partial<AlertDTO>,
  ): ComponentMountingOptions<typeof EditAlert> {
    return {
      props: {
        alert: { ...TestAlertData, ...alert },
      },
      global: {
        stubs: { teleport: true },
      },
    };
  }

  it('will render the form for a new alert', async () => {
    const wrapper = mount(EditAlert, getMountOptions(BlankAlertData));
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(TitleInput).element.value).toBe('');
    expect(wrapper.get<HTMLTextAreaElement>(MessageInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(ActiveInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(ExpiresInput).element.value).toBe('');

    expect(wrapper.get(CancelNewButton).isVisible()).toBe(true);
    expect(wrapper.find(CancelEditButton).exists()).toBe(false);
  });

  it('will render the form for an existing alert', async () => {
    const wrapper = mount(EditAlert, getMountOptions());
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(TitleInput).element.value).toBe(
      TestAlertData.title,
    );
    expect(wrapper.get<HTMLTextAreaElement>(MessageInput).element.value).toBe(
      TestAlertData.message,
    );
    expect(wrapper.get<HTMLInputElement>(ActiveInput).element.value).toBe(
      dayjs(TestAlertData.active).format(DateTimeFormat),
    );
    expect(wrapper.get<HTMLInputElement>(ExpiresInput).element.value).toBe(
      dayjs(TestAlertData.expires).format(DateTimeFormat),
    );

    expect(wrapper.get(SaveButton).isVisible()).toBe(true);
    expect(wrapper.get(CancelEditButton).isVisible()).toBe(true);
    expect(wrapper.find(CancelNewButton).exists()).toBe(false);
  });

  it('will validate for missing fields', async () => {
    const wrapper = mount(EditAlert, getMountOptions(BlankAlertData));

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();

    const titleError = wrapper.get(TitleError);
    expect(titleError.isVisible()).toBe(true);
    expect(titleError.text()).toBe('Alert title is required');

    const messageError = wrapper.get(MessageError);
    expect(messageError.isVisible()).toBe(true);
    expect(messageError.text()).toBe('Alert message body is required');
  });

  it('will validate to ensure that active time is before expires time', async () => {
    const wrapper = mount(
      EditAlert,
      getMountOptions({
        active: new Date('2024-05-02T09:56:27.566Z').valueOf(),
        expires: new Date('2024-04-02T09:56:27.566Z').valueOf(),
      }),
    );

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();

    const expiresError = wrapper.get(ExpiresError);
    expect(expiresError.isVisible()).toBe(true);
    expect(expiresError.text()).toBe(
      'Expiration date must come after activation date',
    );
  });

  it('will emit save event for new alerts', async () => {
    const wrapper = mount(EditAlert, getMountOptions({ id: '' }));
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          ...TestAlertData,
          id: '',
        },
      ],
    ]);
  });

  it('will emit save event for existing alerts', async () => {
    const wrapper = mount(EditAlert, getMountOptions());
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([[TestAlertData]]);
  });

  it('will allow canceling changes to existing alerts', async () => {
    const wrapper = mount(EditAlert, getMountOptions());
    await wrapper.get(TitleInput).setValue('New Title');
    await wrapper.get(MessageInput).setValue('New Message');
    await wrapper.getComponent(FormDatePicker).setValue(new Date());

    await wrapper.get(CancelEditButton).trigger('click');

    expect(wrapper.find('[data-testid="dialog-modal"]').isVisible()).toBe(true);

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
    expect(wrapper.get<HTMLInputElement>(TitleInput).element.value).toBe(
      TestAlertData.title,
    );
    expect(wrapper.get<HTMLInputElement>(MessageInput).element.value).toBe(
      TestAlertData.message,
    );
    expect(wrapper.get<HTMLInputElement>(ActiveInput).element.value).toBe(
      dayjs(TestAlertData.active).format(DateTimeFormat),
    );
    expect(wrapper.get<HTMLInputElement>(ExpiresInput).element.value).toBe(
      dayjs(TestAlertData.expires).format(DateTimeFormat),
    );
  });

  it('will allow user to abort reverting changes to existing alerts', async () => {
    const wrapper = mount(EditAlert, getMountOptions());
    await wrapper.get(TitleInput).setValue('New Title');
    await wrapper.get(MessageInput).setValue('New Message');
    await wrapper.getComponent(FormDatePicker).setValue(new Date());

    await wrapper.get(CancelEditButton).trigger('click');

    expect(wrapper.find('[data-testid="dialog-modal"]').isVisible()).toBe(true);

    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
    expect(wrapper.get<HTMLInputElement>(TitleInput).element.value).toBe(
      'New Title',
    );
    expect(wrapper.get<HTMLInputElement>(MessageInput).element.value).toBe(
      'New Message',
    );
  });
});
