import { AgencyDTO, ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import AgenciesListItem from 'src/components/admin/agencies-list-item.vue';
import EditAgency from 'src/components/admin/edit-agency.vue';
import { useCurrentUser } from 'src/store';
import AgenciesView from 'src/views/admin/agencies-view.vue';
import { ConfirmDialog, RequireAuth } from 'tests/constants';
import { TestAgencies } from 'tests/fixtures/agencies';
import { createRouter } from 'tests/fixtures/create-router';
import { AdminUser, BasicUser } from 'tests/fixtures/users';
import { Router } from 'vue-router';

const AgenciesList = '[data-testid="agencies-list"]';
const CreateButton = '#btn-create-agency';
const CountsText = '[data-testid="agencies-count"]';

describe('Agencies Admin View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof AgenciesView>;
  let listSpy: jest.SpyInstance;

  beforeAll(() => {
    router = createRouter();
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
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

    currentUser.user = AdminUser;

    listSpy = jest
      .spyOn(client.certifications, 'listAgencies')
      .mockResolvedValue({
        data: TestAgencies.map((a) => ({ ...a })),
        totalCount: TestAgencies.length,
      });
  });

  it('will show login form if user is not logged in', async () => {
    currentUser.user = null;
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();
    expect(wrapper.find(RequireAuth.LoginForm).isVisible()).toBe(true);
    expect(wrapper.find(AgenciesList).exists()).toBe(false);
  });

  it('will show forbidden message if user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();
    expect(wrapper.find(RequireAuth.ForbiddenMessage).isVisible()).toBe(true);
    expect(wrapper.find(AgenciesList).exists()).toBe(false);
  });

  it('will mount and display agencies', async () => {
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();
    expect(wrapper.find(AgenciesList).isVisible()).toBe(true);
    expect(wrapper.find(CountsText).text()).toBe('Showing 3 of 3 agencies');
    const items = wrapper.findAllComponents(AgenciesListItem);
    expect(items).toHaveLength(TestAgencies.length);
    items.forEach((item, index) => {
      expect(item.props('agency')).toEqual(TestAgencies[index]);
    });
  });

  it('will indicate if there are no agencies to display', async () => {
    listSpy.mockResolvedValueOnce({ data: [], totalCount: 0 });
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();
    expect(wrapper.find(CountsText).text()).toBe('Showing 0 of 0 agencies');
    expect(wrapper.find('[data-testid="msg-no-agencies"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findAllComponents(AgenciesListItem)).toHaveLength(0);
  });

  it('will allow a user to create a new agency', async () => {
    const newAgency: AgencyDTO = {
      id: '',
      logo: '/img/agencies/na.png',
      name: 'NA',
      longName: 'New Agency',
      website: 'https://www.new-agency.com',
    };
    const expected: AgencyDTO = {
      ...newAgency,
      id: '03633747-b2c0-4b6d-b393-416c5ec7b996',
    };
    const saveSpy = jest
      .spyOn(client.certifications, 'createAgency')
      .mockResolvedValue(expected);
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();

    await wrapper.get(CreateButton).trigger('click');
    const editor = wrapper.findComponent(EditAgency);
    expect(editor.isVisible()).toBe(true);
    expect(editor.props('agency')).toBeUndefined();

    editor.vm.$emit('save', newAgency);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(newAgency);
    expect(wrapper.findComponent(EditAgency).exists()).toBe(false);
    expect(wrapper.find(CountsText).text()).toBe('Showing 4 of 4 agencies');
    expect(wrapper.findComponent(AgenciesListItem).props('agency')).toEqual(
      expected,
    );
  });

  it('will allow a user to cancel creating a new agency', async () => {
    const saveSpy = jest.spyOn(client.certifications, 'createAgency');
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();

    await wrapper.get(CreateButton).trigger('click');
    const editor = wrapper.findComponent(EditAgency);
    expect(editor.isVisible()).toBe(true);
    editor.vm.$emit('cancel');
    await flushPromises();

    expect(wrapper.findComponent(EditAgency).exists()).toBe(false);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(wrapper.find(CountsText).text()).toBe('Showing 3 of 3 agencies');
  });

  it('will allow a user to edit an existing agency', async () => {
    const expected: AgencyDTO = {
      ...TestAgencies[1],
      name: 'UA',
      longName: 'Updated Agency',
      website: 'https://www.agency.edu',
    };
    const saveSpy = jest
      .spyOn(client.certifications, 'updateAgency')
      .mockResolvedValue(expected);
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="edit-agency-${TestAgencies[1].name}"]`)
      .trigger('click');
    const editor = wrapper.findComponent(EditAgency);
    expect(editor.isVisible()).toBe(true);
    editor.vm.$emit('save', expected);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(expected.id, expected);
    expect(wrapper.findComponent(EditAgency).exists()).toBe(false);
    expect(wrapper.find(CountsText).text()).toBe('Showing 3 of 3 agencies');
    expect(
      wrapper.findAllComponents(AgenciesListItem).at(1)?.props('agency'),
    ).toEqual(expected);
  });

  it('will allow a user to cancel editing an existing agency', async () => {
    const saveSpy = jest.spyOn(client.certifications, 'updateAgency');
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="edit-agency-${TestAgencies[1].name}"]`)
      .trigger('click');
    const editor = wrapper.findComponent(EditAgency);
    expect(editor.isVisible()).toBe(true);
    editor.vm.$emit('cancel');
    await flushPromises();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(wrapper.findComponent(EditAgency).exists()).toBe(false);
  });

  it('will allow a user to delete an existing agency', async () => {
    const deleteSpy = jest
      .spyOn(client.certifications, 'deleteAgency')
      .mockResolvedValue();
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="delete-agency-${TestAgencies[1].name}"]`)
      .trigger('click');
    await wrapper.get(ConfirmDialog.Confirm).trigger('click');
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledWith(TestAgencies[1].id);
    expect(wrapper.findComponent(ConfirmDialog.Confirm).exists()).toBe(false);
    expect(wrapper.find(CountsText).text()).toBe('Showing 2 of 2 agencies');
    const items = wrapper.findAllComponents(AgenciesListItem);
    expect(items).toHaveLength(2);
    expect(
      items.some((item) => item.props('agency').id === TestAgencies[1].id),
    ).toBe(false);
  });

  it('will allow a user to cancel deleting an existing agency', async () => {
    const wrapper = mount(AgenciesView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="delete-agency-${TestAgencies[1].name}"]`)
      .trigger('click');
    await wrapper.get(ConfirmDialog.Cancel).trigger('click');
    await flushPromises();

    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false);
    expect(wrapper.findAllComponents(AgenciesListItem)).toHaveLength(3);
  });
});
