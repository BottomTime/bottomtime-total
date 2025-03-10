import { ApiClient, ProfessionalAssociationDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import EditProfessionalAssociation from 'src/components/users/edit-professional-association.vue';
import ProfessionalAssociationListItem from 'src/components/users/professional-association-list-item.vue';
import { useCurrentUser } from 'src/store';
import ProfessionalAssociationsView from 'src/views/users/professional-associations-view.vue';
import { ConfirmDialog, RequireAuth } from 'tests/constants';
import { TestAgencies } from 'tests/fixtures/agencies';
import { createRouter } from 'tests/fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithEmptyProfile,
} from 'tests/fixtures/users';
import { Router } from 'vue-router';

const TestAssociations: ProfessionalAssociationDTO[] = [
  {
    agency: TestAgencies[0],
    id: 'f75921ab-148b-49a6-b560-65c5b94f2118',
    identificationNumber: '123456',
    title: 'Instructor',
  },
  {
    agency: TestAgencies[1],
    id: '552d2e02-ab2a-49b8-bbf8-2e82214d83a2',
    identificationNumber: '654321',
    title: 'Dive Master',
    startDate: '2019-01-01',
  },
];

const AddAssociationButton = 'button#add-association';
const AssociationsList = '[data-testid="associations-list"]';
const CountsText = '[data-testid="association-counts"]';

describe('Professional Associations View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let associations: ProfessionalAssociationDTO[];
  let opts: ComponentMountingOptions<typeof ProfessionalAssociationsView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/profile/:username/associations',
        component: ProfessionalAssociationsView,
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          EditProfessionalAssociation: true,
          teleport: true,
        },
      },
    };

    currentUser.user = BasicUser;
    associations = TestAssociations;
    await router.push(`/profile/${BasicUser.username}/associations`);

    jest.spyOn(client.certifications, 'listAgencies').mockResolvedValue({
      data: TestAgencies,
      totalCount: TestAgencies.length,
    });
    jest
      .spyOn(client.certifications, 'listProfessionalAssociations')
      .mockImplementation(() =>
        Promise.resolve({
          data: associations.map((a) => ({ ...a })),
          totalCount: associations.length,
        }),
      );
  });

  it('will show login form if user is anonymous', async () => {
    currentUser.user = null;
    const wrapper = mount(ProfessionalAssociationsView, opts);
    expect(wrapper.get(RequireAuth.LoginForm).isVisible()).toBe(true);
    expect(wrapper.find(AssociationsList).exists()).toBe(false);
  });

  it('will show forbidden message if user is not the profile owner', async () => {
    currentUser.user = UserWithEmptyProfile;
    const wrapper = mount(ProfessionalAssociationsView, opts);
    expect(wrapper.get(RequireAuth.ForbiddenMessage).isVisible()).toBe(true);
    expect(wrapper.find(AssociationsList).exists()).toBe(false);
  });

  it("will render a user's associations", async () => {
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    expect(wrapper.get(CountsText).text()).toBe(
      'Showing 2 of 2 professional associations.',
    );
    const items = wrapper.findAllComponents(ProfessionalAssociationListItem);
    expect(items).toHaveLength(associations.length);
    items.forEach((item, i) => {
      expect(item.props('association')).toEqual(associations[i]);
    });
  });

  it("will allow an admin to view another user's associations", async () => {
    currentUser.user = AdminUser;
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    expect(wrapper.get(CountsText).text()).toBe(
      'Showing 2 of 2 professional associations.',
    );
    const items = wrapper.findAllComponents(ProfessionalAssociationListItem);
    expect(items).toHaveLength(associations.length);
    items.forEach((item, i) => {
      expect(item.props('association')).toEqual(associations[i]);
    });
  });

  it('will indicate if a user does not have any associations', async () => {
    associations = [];
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    expect(wrapper.get(CountsText).text()).toBe(
      'Showing 0 of 0 professional associations.',
    );
    expect(wrapper.get('[data-testid="no-associations-msg"]').isVisible()).toBe(
      true,
    );
    expect(
      wrapper.findAllComponents(ProfessionalAssociationListItem),
    ).toHaveLength(0);
  });

  it('will allow a user to create a new association', async () => {
    const associationId = 'e83577f9-55f7-49a8-a3c1-f6ae0bc5e5a2';
    const newAssociation: ProfessionalAssociationDTO = {
      id: '',
      agency: TestAgencies[2],
      identificationNumber: '3333-1234',
      title: 'Instructor Trainer',
      startDate: '2020-01-01',
    };
    const expected: ProfessionalAssociationDTO = {
      ...newAssociation,
      id: associationId,
    };
    const saveSpy = jest
      .spyOn(client.certifications, 'createProfessionalAssociation')
      .mockResolvedValue(expected);
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    await wrapper.get(AddAssociationButton).trigger('click');

    const edit = wrapper.getComponent(EditProfessionalAssociation);
    expect(edit.props('association')).toBeUndefined();
    expect(edit.props('agencies')).toEqual(TestAgencies);

    edit.vm.$emit('save', newAssociation);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(BasicUser.username, {
      ...newAssociation,
      agency: newAssociation.agency.id,
    });
    const item = wrapper.getComponent(ProfessionalAssociationListItem);
    expect(item.props('association')).toEqual(expected);
  });

  it('will allow a user to cancel creating a new association', async () => {
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    await wrapper.get(AddAssociationButton).trigger('click');
    wrapper.getComponent(EditProfessionalAssociation).vm.$emit('cancel');
    await flushPromises();

    expect(wrapper.findComponent(EditProfessionalAssociation).exists()).toBe(
      false,
    );
  });

  it('will allow a user to edit an existing association', async () => {
    const expected: ProfessionalAssociationDTO = {
      ...associations[0],
      agency: TestAgencies[2],
      title: 'Course Director',
      identificationNumber: '1234-5678',
      startDate: '2025-02-02',
    };
    const saveSpy = jest
      .spyOn(client.certifications, 'updateProfessionalAssociation')
      .mockResolvedValue(expected);
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="edit-assoc-${associations[0].id}"]`)
      .trigger('click');
    const editor = wrapper.getComponent(EditProfessionalAssociation);
    expect(editor.props('association')).toEqual(associations[0]);
    editor.vm.$emit('save', expected);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(
      BasicUser.username,
      associations[0].id,
      {
        ...expected,
        agency: expected.agency.id,
      },
    );
    const item = wrapper.getComponent(ProfessionalAssociationListItem);
    expect(item.props('association')).toEqual(expected);
    expect(wrapper.findComponent(EditProfessionalAssociation).exists()).toBe(
      false,
    );
  });

  it('will allow a user to cancel editing an association', async () => {
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="edit-assoc-${associations[0].id}"]`)
      .trigger('click');
    wrapper.getComponent(EditProfessionalAssociation).vm.$emit('cancel');
    await flushPromises();

    expect(wrapper.findComponent(EditProfessionalAssociation).exists()).toBe(
      false,
    );
  });

  it('will allow a user to delete an association', async () => {
    const deleteSpy = jest
      .spyOn(client.certifications, 'deleteProfessionalAssociation')
      .mockResolvedValue();
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="delete-assoc-${associations[1].id}"]`)
      .trigger('click');
    await wrapper.get(ConfirmDialog.Confirm).trigger('click');
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledWith(
      BasicUser.username,
      associations[1].id,
    );
    expect(wrapper.find(ConfirmDialog.Confirm).exists()).toBe(false);
    expect(wrapper.find(`a#a-${associations[1].id}`).exists()).toBe(false);
  });

  it('will allow a user to cancel deleting an association', async () => {
    const wrapper = mount(ProfessionalAssociationsView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="delete-assoc-${associations[1].id}"]`)
      .trigger('click');
    await wrapper.get(ConfirmDialog.Cancel).trigger('click');
    await flushPromises();

    expect(wrapper.find(ConfirmDialog.Cancel).exists()).toBe(false);
    expect(wrapper.find(`a#a-${associations[1].id}`).isVisible()).toBe(true);
  });
});
