import {
  ApiClient,
  CreateOrUpdateOperatorDTO,
  Fetcher,
  OperatorDTO,
  VerificationStatus,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import EditOperatorInfo from 'src/components/operators/editor/edit-operator-info.vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import EditOperator from '../../../../src/components/operators/edit-operator.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import {
  BlankOperator,
  FullOperator,
  PartialOperator,
} from '../../../fixtures/operators';
import { AdminUser } from '../../../fixtures/users';

const DeleteButton = '[data-testid="btn-delete-operator"]';

const VerifiedBadge = '[data-testid="operator-verified"]';
const UnverifiedMessage = '[data-testid="operator-unverified"]';
const VerificationRejectedMessage =
  '[data-testid="operator-verification-rejected"]';
const VerificationPendingMessage =
  '[data-testid="operator-verification-pending"]';
const RequestVerificationButton = '#btn-request-verification';
const ApproveButton = '#btn-approve-verification';
const RejectButton = '#btn-reject-verification';

describe('EditOperator component', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof EditOperator>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        operator: { ...BlankOperator },
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will render a blank operator', () => {
    const wrapper = mount(EditOperator, opts);
    const editInfo = wrapper.getComponent(EditOperatorInfo);
    expect(editInfo.isVisible()).toBe(true);
    expect(editInfo.props('operator')).toEqual(BlankOperator);
    expect(wrapper.find('[data-testid="tab-diveSites"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="tab-teamMembers"]').exists()).toBe(
      false,
    );
  });

  it('will render saved operator', async () => {
    const wrapper = mount(EditOperator, opts);
    await wrapper.setProps({ operator: PartialOperator });
    const editInfo = wrapper.getComponent(EditOperatorInfo);
    expect(editInfo.isVisible()).toBe(true);
    expect(editInfo.props('operator')).toEqual(PartialOperator);
    expect(wrapper.find('[data-testid="tab-diveSites"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="tab-teamMembers"]').isVisible()).toBe(
      true,
    );
  });

  it('will bubble up "save" event when operator info is modified', async () => {
    const update: CreateOrUpdateOperatorDTO = {
      active: true,
      address: '1234 Main St.',
      description: 'A description',
      name: 'New Operator',
      slug: 'new-operator',
    };
    const wrapper = mount(EditOperator, opts);
    await wrapper.setProps({ operator: FullOperator });

    wrapper.getComponent(EditOperatorInfo).vm.$emit('save', update);
    expect(wrapper.emitted('save')).toEqual([[update]]);
  });

  it('will bubble up a "delete" event when operator is deleted', async () => {
    const wrapper = mount(EditOperator, opts);
    await wrapper.setProps({ operator: FullOperator });
    await wrapper.get(DeleteButton).trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[FullOperator]]);
  });

  it('will bubble up a "logo-changed" event when logo is changed', async () => {
    const file = '/new/img/filename.jpg';
    const wrapper = mount(EditOperator, opts);
    await wrapper.setProps({ operator: FullOperator });
    wrapper.getComponent(EditOperatorInfo).vm.$emit('logo-changed', file);
    expect(wrapper.emitted('logo-changed')).toEqual([[file]]);
  });

  describe('when requesting verification', () => {
    it('will not show verification components for new operators that have not been saved yet', () => {
      const wrapper = mount(EditOperator, {
        ...opts,
        props: {
          operator: BlankOperator,
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).exists()).toBe(false);
    });

    it('will show when an operator has not yet requested verification', () => {
      const wrapper = mount(EditOperator, {
        ...opts,
        props: {
          operator: {
            ...FullOperator,
            verificationStatus: VerificationStatus.Unverified,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).isVisible()).toBe(true);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).isVisible()).toBe(true);
    });

    it('will show when an operator has been verified', () => {
      const wrapper = mount(EditOperator, {
        ...opts,
        props: {
          operator: {
            ...FullOperator,
            verificationStatus: VerificationStatus.Verified,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).isVisible()).toBe(true);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).exists()).toBe(false);
    });

    it('will show when verification is pending', async () => {
      const wrapper = mount(EditOperator, {
        ...opts,
        props: {
          operator: {
            ...FullOperator,
            verificationStatus: VerificationStatus.Pending,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).isVisible()).toBe(true);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).exists()).toBe(false);
    });

    it('will show when verification has been rejected (with reason)', async () => {
      const message = 'Omg! A message!!';
      const wrapper = mount(EditOperator, {
        ...opts,
        props: {
          operator: {
            ...FullOperator,
            verificationStatus: VerificationStatus.Rejected,
            verificationMessage: message,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).isVisible()).toBe(true);
      expect(wrapper.find(RequestVerificationButton).isVisible()).toBe(true);
      expect(
        wrapper.find('[data-testid="verification-rejection-message"]').text(),
      ).toBe(message);
    });

    it('will allow a user to request verification', async () => {
      const operatorData = {
        ...FullOperator,
        verificationStatus: VerificationStatus.Unverified,
        verificationMessage: undefined,
      };
      const spy = jest
        .spyOn(client.operators, 'requestVerification')
        .mockResolvedValue(operatorData);
      const wrapper = mount(EditOperator, {
        ...opts,
        props: {
          operator: operatorData,
        },
      });

      await wrapper.get(RequestVerificationButton).trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(operatorData);
      expect(wrapper.emitted('verification-requested')).toEqual([
        [operatorData],
      ]);
    });

    it('will allow a user to cancel a request for verification', async () => {
      const operatorData = {
        ...FullOperator,
        verificationStatus: VerificationStatus.Unverified,
        verificationMessage: undefined,
      };
      const spy = jest
        .spyOn(client.operators, 'requestVerification')
        .mockResolvedValue(operatorData);
      const wrapper = mount(EditOperator, {
        ...opts,
        props: {
          operator: operatorData,
        },
      });

      await wrapper.get(RequestVerificationButton).trigger('click');
      await wrapper
        .get('[data-testid="dialog-cancel-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(wrapper.emitted('verification-requested')).toBeUndefined();
    });
  });

  describe('when reviewing verification requests as an admin', () => {
    let operatorData: OperatorDTO;

    beforeEach(() => {
      currentUser.user = AdminUser;
      operatorData = {
        ...FullOperator,
        verificationStatus: VerificationStatus.Pending,
        verificationMessage: undefined,
      };
      opts = {
        ...opts,
        props: {
          operator: operatorData,
        },
      };
    });

    it('will allow an admin to approve a request', async () => {
      const spy = jest
        .spyOn(client.operators, 'setVerified')
        .mockResolvedValue(operatorData);
      const wrapper = mount(EditOperator, opts);

      await wrapper.get(ApproveButton).trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(operatorData, true);
      expect(wrapper.emitted('verified')).toBeDefined();
    });

    it('will allow an admin to change their mind about approving a request', async () => {
      const spy = jest
        .spyOn(client.operators, 'setVerified')
        .mockResolvedValue(operatorData);
      const wrapper = mount(EditOperator, opts);

      await wrapper.get(ApproveButton).trigger('click');
      await wrapper
        .get('[data-testid="dialog-cancel-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(wrapper.emitted('verified')).toBeUndefined();
    });

    it('will allow an admin to reject a request', async () => {
      const spy = jest
        .spyOn(client.operators, 'setVerified')
        .mockResolvedValue(operatorData);
      const wrapper = mount(EditOperator, opts);

      await wrapper.get(RejectButton).trigger('click');
      await wrapper.get('[data-testid="btn-confirm-reject"]').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(operatorData, false, undefined);
      expect(wrapper.emitted('rejected')).toEqual([[undefined]]);
    });

    it('will allow an admin to reject a request with a message', async () => {
      const message = 'You are not ready';
      const spy = jest
        .spyOn(client.operators, 'setVerified')
        .mockResolvedValue(operatorData);
      const wrapper = mount(EditOperator, opts);

      await wrapper.get(RejectButton).trigger('click');
      await wrapper.get('#reject-reason').setValue(message);
      await wrapper.get('[data-testid="btn-confirm-reject"]').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(operatorData, false, message);
      expect(wrapper.emitted('rejected')).toEqual([[message]]);
    });

    it('will allow an admin to change their mind about rejecting a request', async () => {
      const spy = jest
        .spyOn(client.operators, 'setVerified')
        .mockResolvedValue(operatorData);
      const wrapper = mount(EditOperator, opts);

      await wrapper.get(RejectButton).trigger('click');
      await wrapper.get('[data-testid="btn-cancel-reject"]').trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(wrapper.emitted('rejected')).toBeUndefined();
    });
  });
});
