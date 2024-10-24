import { VerificationStatus } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import VerificationBadge from '../../../../src/components/operators/verification-badge.vue';
import { useCurrentUser } from '../../../../src/store';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const AdminVerificationMessage = '[data-testid="admin-verification-status"]';
const UserVerificationMessage = '[data-testid="verification-status"]';
const RequestVerificationButton = 'button#btn-request-verification';
const ApproveButton = 'button#btn-approve-verification';
const RejectButton = 'button#btn-reject-verification';

describe('VerificationBadge component', () => {
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof VerificationBadge>;

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        status: VerificationStatus.Unverified,
      },
      global: {
        plugins: [pinia],
      },
    };
    currentUser.user = BasicUser;
  });

  [
    VerificationStatus.Unverified,
    VerificationStatus.Pending,
    VerificationStatus.Verified,
    VerificationStatus.Rejected,
  ].forEach((status) => {
    it(`will render badge correctly for verification status: ${status}`, async () => {
      const message = 'Verification message!!';
      const wrapper = mount(VerificationBadge, opts);
      await wrapper.setProps({ status, message });
      expect(wrapper.find(AdminVerificationMessage).exists()).toBe(false);
      expect(wrapper.get(UserVerificationMessage).html()).toMatchSnapshot();
    });

    it(`will render badge correctly for admins for verification status: ${status}`, async () => {
      currentUser.user = AdminUser;
      const message = 'Verification message!!';
      const wrapper = mount(VerificationBadge, opts);
      await wrapper.setProps({ status, message });
      expect(wrapper.get(AdminVerificationMessage).html()).toMatchSnapshot();
      expect(wrapper.find(UserVerificationMessage).exists()).toBe(false);
    });
  });

  it('will not render with no status displayed', async () => {
    const wrapper = mount(VerificationBadge, opts);
    await wrapper.setProps({ status: undefined });
    expect(wrapper.text()).toBe('');
  });

  it('will allow a user to request verification', async () => {
    const wrapper = mount(VerificationBadge, opts);
    await wrapper.get(RequestVerificationButton).trigger('click');
    expect(wrapper.emitted('request-verification')).toBeDefined();
  });

  it('will allow a user to re-request verification after rejection', async () => {
    const wrapper = mount(VerificationBadge, opts);
    await wrapper.setProps({ status: VerificationStatus.Rejected });
    await wrapper.get(RequestVerificationButton).trigger('click');
    expect(wrapper.emitted('request-verification')).toBeDefined();
  });

  it('will allow an admin to approve verification', async () => {
    currentUser.user = AdminUser;
    const wrapper = mount(VerificationBadge, opts);
    await wrapper.setProps({ status: VerificationStatus.Pending });
    await wrapper.get(ApproveButton).trigger('click');
    expect(wrapper.emitted('verify')).toBeDefined();
  });

  it('will allow an admin to reject verification', async () => {
    currentUser.user = AdminUser;
    const wrapper = mount(VerificationBadge, opts);
    await wrapper.setProps({ status: VerificationStatus.Pending });
    await wrapper.get(RejectButton).trigger('click');
    expect(wrapper.emitted('reject')).toBeDefined();
  });
});
