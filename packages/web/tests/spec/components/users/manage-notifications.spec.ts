import {
  ApiClient,
  Fetcher,
  NotificationType,
  User,
  UserDTO,
} from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Mock } from 'moq.ts';
import { Pinia, createPinia } from 'pinia';

import { ApiClientKey } from '../../../../src/api-client';
import FormCheckbox from '../../../../src/components/common/form-checkbox.vue';
import ManageNotifications from '../../../../src/components/users/manage-notifications.vue';
import { useToasts } from '../../../../src/store';
import { BasicUser } from '../../../fixtures/users';

const LoadFailedError = '[data-testid="notifications-load-failed"]';
const NotificationsGrid = '[data-testid="notifications-grid"]';
const SaveButton = '#btn-save-notifications';
const CancelButton = '#btn-cancel-notifications';

function notificationChecbox(type: NotificationType, key: EventKey): string {
  return `[data-testid="notify-${type}-${key}"]`;
}

describe('ManageNotifications component', () => {
  let fetcher: Fetcher;
  let client: ApiClient;

  let userData: UserDTO;
  let user: User;
  let pinia: Pinia;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof ManageNotifications>;

  beforeAll(() => {
    fetcher = new Mock<Fetcher>().object();
    client = new ApiClient({ fetcher });
  });

  beforeEach(() => {
    userData = BasicUser;
    user = new User(fetcher, userData);
    pinia = createPinia();
    toasts = useToasts(pinia);
    opts = {
      props: { user: userData },
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    };
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(user);
  });

  it('will render an error message if notification settings cannot be retrieved', async () => {
    jest
      .spyOn(user.settings, 'getNotificationWhitelists')
      .mockRejectedValue(new Error('nope'));

    const wrapper = mount(ManageNotifications, opts);
    await flushPromises();

    expect(wrapper.get(LoadFailedError).isVisible()).toBe(true);
    expect(wrapper.find(NotificationsGrid).exists()).toBe(false);
  });

  it('will render with all notifications enabled', async () => {
    jest.spyOn(user.settings, 'getNotificationWhitelists').mockResolvedValue({
      email: ['*'],
      pushNotification: ['*'],
    });

    const wrapper = mount(ManageNotifications, opts);
    await flushPromises();

    expect(wrapper.find(LoadFailedError).exists()).toBe(false);

    const checkboxes = wrapper.findAllComponents(FormCheckbox);
    expect(checkboxes).toHaveLength(12);
    checkboxes.forEach((cb) => {
      expect(cb.props('modelValue')).toBe(true);
    });
  });

  it('will render with no notifications enabled', async () => {
    jest.spyOn(user.settings, 'getNotificationWhitelists').mockResolvedValue({
      email: [],
      pushNotification: [],
    });

    const wrapper = mount(ManageNotifications, opts);
    await flushPromises();

    expect(wrapper.find(LoadFailedError).exists()).toBe(false);

    const checkboxes = wrapper.findAllComponents(FormCheckbox);
    expect(checkboxes).toHaveLength(12);
    checkboxes.forEach((cb) => {
      expect(cb.props('modelValue')).toBe(false);
    });
  });

  it('will render with some notifications enabled', async () => {
    jest.spyOn(user.settings, 'getNotificationWhitelists').mockResolvedValue({
      email: ['friendRequest.*', 'membership.canceled', 'user.*'],
      pushNotification: ['friendRequest.accepted'],
    });

    const wrapper = mount(ManageNotifications, opts);
    await flushPromises();

    expect(wrapper.find(LoadFailedError).exists()).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipCanceled,
        ),
      ).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(NotificationType.Email, EventKey.MembershipChanged),
      ).element.checked,
    ).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(NotificationType.Email, EventKey.MembershipCreated),
      ).element.checked,
    ).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipInvoiceCreated,
        ),
      ).element.checked,
    ).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipPaymentFailed,
        ),
      ).element.checked,
    ).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipTrialEnding,
        ),
      ).element.checked,
    ).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.FriendRequestAccepted,
        ),
      ).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.FriendRequestCreated,
        ),
      ).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.FriendRequestRejected,
        ),
      ).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.PushNotification,
          EventKey.FriendRequestAccepted,
        ),
      ).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.PushNotification,
          EventKey.FriendRequestCreated,
        ),
      ).element.checked,
    ).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.PushNotification,
          EventKey.FriendRequestRejected,
        ),
      ).element.checked,
    ).toBe(false);
  });

  it('will allow users to update their notification settings', async () => {
    jest.spyOn(user.settings, 'getNotificationWhitelists').mockResolvedValue({
      email: [],
      pushNotification: ['*'],
    });
    const saveSpy = jest
      .spyOn(user.settings, 'updateNotificationWhitelist')
      .mockResolvedValue();

    const wrapper = mount(ManageNotifications, opts);
    await flushPromises();

    await wrapper
      .get(
        notificationChecbox(
          NotificationType.Email,
          EventKey.FriendRequestAccepted,
        ),
      )
      .setValue(true);
    await wrapper
      .get(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipPaymentFailed,
        ),
      )
      .setValue(true);
    await wrapper
      .get(
        notificationChecbox(
          NotificationType.PushNotification,
          EventKey.FriendRequestAccepted,
        ),
      )
      .setValue(false);

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(NotificationType.Email, [
      EventKey.MembershipPaymentFailed,
      EventKey.FriendRequestAccepted,
    ]);
    expect(saveSpy).toHaveBeenCalledWith(NotificationType.PushNotification, [
      'user.*',
      'membership.*',
      EventKey.FriendRequestCreated,
      EventKey.FriendRequestRejected,
    ]);
    expect(toasts.toasts[0].id).toBe('notifications-saved');
  });

  it('will allow users to revert their changes before saving', async () => {
    jest.spyOn(user.settings, 'getNotificationWhitelists').mockResolvedValue({
      email: [],
      pushNotification: [],
    });
    const saveSpy = jest
      .spyOn(user.settings, 'updateNotificationWhitelist')
      .mockResolvedValue();

    const wrapper = mount(ManageNotifications, opts);
    await flushPromises();

    await wrapper
      .get(
        notificationChecbox(
          NotificationType.Email,
          EventKey.FriendRequestAccepted,
        ),
      )
      .setValue(true);
    await wrapper
      .get(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipPaymentFailed,
        ),
      )
      .setValue(true);
    await wrapper
      .get(
        notificationChecbox(
          NotificationType.PushNotification,
          EventKey.FriendRequestAccepted,
        ),
      )
      .setValue(true);

    await wrapper.get(CancelButton).trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(saveSpy).not.toHaveBeenCalled();

    const checkboxes = wrapper.findAllComponents(FormCheckbox);
    checkboxes.forEach((cb) => {
      expect(cb.props('modelValue')).toBe(false);
    });
  });

  it('will allow users to change their minds about canceling changes', async () => {
    jest.spyOn(user.settings, 'getNotificationWhitelists').mockResolvedValue({
      email: [],
      pushNotification: [],
    });
    const saveSpy = jest
      .spyOn(user.settings, 'updateNotificationWhitelist')
      .mockResolvedValue();

    const wrapper = mount(ManageNotifications, opts);
    await flushPromises();

    await wrapper
      .get(
        notificationChecbox(
          NotificationType.Email,
          EventKey.FriendRequestAccepted,
        ),
      )
      .setValue(true);
    await wrapper
      .get(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipPaymentFailed,
        ),
      )
      .setValue(true);
    await wrapper
      .get(
        notificationChecbox(
          NotificationType.PushNotification,
          EventKey.FriendRequestAccepted,
        ),
      )
      .setValue(true);

    await wrapper.get(CancelButton).trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(saveSpy).not.toHaveBeenCalled();

    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.FriendRequestAccepted,
        ),
      ).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.Email,
          EventKey.MembershipPaymentFailed,
        ),
      ).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(
        notificationChecbox(
          NotificationType.PushNotification,
          EventKey.FriendRequestAccepted,
        ),
      ).element.checked,
    ).toBe(true);
  });
});
