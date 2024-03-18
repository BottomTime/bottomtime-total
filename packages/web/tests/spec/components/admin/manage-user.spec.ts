import { UserDTO, UserRole } from '@bottomtime/api';

import { ComponentMountingOptions, shallowMount } from '@vue/test-utils';

import AdminManageUser from '../../../../src/components/admin/manage-user.vue';
import FormBox from '../../../../src/components/common/form-box.vue';
import TabsPanel from '../../../../src/components/common/tabs-panel.vue';
import { BasicUser } from '../../../fixtures/users';
import MockEditProfile from '../../../stubs/edit-profile.stub.vue';
import MockEditSettings from '../../../stubs/edit-settings.stub.vue';
import MockManageUserAccount from '../../../stubs/manage-user-account.stub.vue';

describe('Admin Manage User component', () => {
  let userData: UserDTO;
  let opts: ComponentMountingOptions<typeof AdminManageUser>;

  beforeEach(() => {
    userData = { ...BasicUser };
    opts = {
      props: { user: userData },
      global: {
        stubs: {
          EditProfile: MockEditProfile,
          EditSettings: MockEditSettings,
          FormBox,
          ManageUserAccount: MockManageUserAccount,
          TabsPanel,
        },
      },
    };
  });

  it('will allow navigation through tabs', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);

    expect(
      wrapper.find('[data-testid="manage-user-account"]').isVisible(),
    ).toBe(true);

    await wrapper.find('[data-testid="tab-profile"]').trigger('click');
    expect(wrapper.find('[data-testid="edit-profile"]').isVisible()).toBe(true);

    await wrapper.find('[data-testid="tab-settings"]').trigger('click');
    expect(wrapper.find('[data-testid="edit-settings"]').isVisible()).toBe(
      true,
    );

    await wrapper.find('[data-testid="tab-manage"]').trigger('click');
    expect(
      wrapper.find('[data-testid="manage-user-account"]').isVisible(),
    ).toBe(true);
  });

  it('will propagate event when account lock is toggled', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);
    wrapper.findComponent(MockManageUserAccount).vm.toggleAccountLock();
    expect(wrapper.emitted('account-lock-toggled')).toEqual([[userData.id]]);
  });

  it('will propagate event when password is reset', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);
    wrapper.findComponent(MockManageUserAccount).vm.resetPassword();
    expect(wrapper.emitted('password-reset')).toEqual([[userData.id]]);
  });

  it('will propagate event when role is changed', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);
    wrapper.findComponent(MockManageUserAccount).vm.changeRole(UserRole.Admin);
    expect(wrapper.emitted('role-changed')).toEqual([
      [userData.id, UserRole.Admin],
    ]);
  });

  it('will propagate event when username is changed', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);
    wrapper
      .findComponent(MockManageUserAccount)
      .vm.changeUsername('new-username');
    expect(wrapper.emitted('username-changed')).toEqual([
      [userData.id, 'new-username'],
    ]);
  });

  it('will propagate event when email is changed', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);
    wrapper
      .findComponent(MockManageUserAccount)
      .vm.changeEmail('new-email@gmail.org');
    expect(wrapper.emitted('email-changed')).toEqual([
      [userData.id, 'new-email@gmail.org'],
    ]);
  });

  it('will propagate event when profile is updated', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);
    await wrapper.get('[data-testid="tab-profile"]').trigger('click');

    wrapper.findComponent(MockEditProfile).vm.saveProfile();
    expect(wrapper.emitted('save-profile')).toEqual([
      [userData.id, userData.profile],
    ]);
  });

  it('will popagate event when settings are updated', async () => {
    const wrapper = shallowMount(AdminManageUser, opts);
    await wrapper.get('[data-testid="tab-settings"]').trigger('click');

    wrapper.findComponent(MockEditSettings).vm.saveSettings();
    expect(wrapper.emitted('save-settings')).toEqual([
      [userData.id, userData.settings],
    ]);
  });
});
