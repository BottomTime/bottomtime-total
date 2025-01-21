import { ApiClient, DiveSiteDTO } from '@bottomtime/api';
import { Fetcher } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import EditDiveSite from '../../../../src/components/diveSites/edit-dive-site.vue';
import ViewDiveSite from '../../../../src/components/diveSites/view-dive-site.vue';
import { useCurrentUser } from '../../../../src/store';
import DiveSiteView from '../../../../src/views/sites/dive-site-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import { DiveSiteWithFullProperties } from '../../../fixtures/sites';
import {
  AdminUser,
  BasicUser,
  UserWithEmptyProfile,
} from '../../../fixtures/users';
import StarRatingStub from '../../../star-rating-stub.vue';

describe('Dive Site View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof DiveSiteView>;
  let siteData: DiveSiteDTO;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/diveSites/new',
        name: 'NewDiveSite',
        component: DiveSiteView,
      },
      {
        path: '/diveSites/:siteId',
        name: 'DiveSite',
        component: DiveSiteView,
      },
    ]);
  });

  beforeEach(async () => {
    await router.push(`/diveSites/${DiveSiteWithFullProperties.id}`);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    currentUser.user = null;
    siteData = {
      ...DiveSiteWithFullProperties,
      creator: BasicUser.profile,
    };

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will show not found message if dive site cannot be found', async () => {
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockRejectedValue(createHttpError(404));
    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id);
    expect(wrapper.find('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
  });

  it('will render login form if anonymous user attempts to create a new site', async () => {
    await router.push('/diveSites/new');
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockRejectedValue(siteData);
    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
    expect(wrapper.findComponent(EditDiveSite).exists()).toBe(false);
  });

  it('will render in read-only mode for anonymous users', async () => {
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockResolvedValue(siteData);
    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id);
    const viewer = wrapper.getComponent(ViewDiveSite);
    expect(viewer.isVisible()).toBe(true);
    expect(viewer.props('site')).toEqual(siteData);
  });

  it('will render in read-only mode for non-owners of the site', async () => {
    currentUser.user = UserWithEmptyProfile;
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockResolvedValue(siteData);
    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id);
    const viewer = wrapper.getComponent(ViewDiveSite);
    expect(viewer.isVisible()).toBe(true);
    expect(viewer.props('site')).toEqual(siteData);
  });

  it('will render in edit mode for owners of the site', async () => {
    currentUser.user = BasicUser;
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockResolvedValue(siteData);
    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id);
    const editor = wrapper.getComponent(EditDiveSite);
    expect(editor.isVisible()).toBe(true);
    expect(editor.props('site')).toEqual(siteData);
  });

  it('will render in edit mode for admins', async () => {
    currentUser.user = AdminUser;
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockResolvedValue(siteData);
    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id);
    const editor = wrapper.getComponent(EditDiveSite);
    expect(editor.isVisible()).toBe(true);
    expect(editor.props('site')).toEqual(siteData);
  });

  it('will allow the user to save changes to a site', async () => {
    const expected: DiveSiteDTO = {
      ...siteData,
      description: 'New description',
      name: 'New name',
      freeToDive: true,
      shoreAccess: false,
      location: 'South Divesville',
    };

    currentUser.user = BasicUser;
    jest.spyOn(client.diveSites, 'getDiveSite').mockResolvedValue(siteData);
    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    wrapper.getComponent(EditDiveSite).vm.$emit('site-updated', expected);
    await flushPromises();
    expect(wrapper.getComponent(EditDiveSite).props('site')).toEqual(expected);
  });

  it('will allow the user to create a new site', async () => {
    const expected: DiveSiteDTO = {
      createdOn: Date.now(),
      creator: BasicUser.profile,
      id: '',
      description: 'New description',
      name: 'New name',
      freeToDive: true,
      shoreAccess: false,
      location: 'South Divesville',
    };
    currentUser.user = BasicUser;
    await router.push('/diveSites/new');

    const wrapper = mount(DiveSiteView, opts);
    await flushPromises();

    wrapper.getComponent(EditDiveSite).vm.$emit('site-updated', expected);
    await flushPromises();
    expect(wrapper.getComponent(EditDiveSite).props('site')).toEqual(expected);
  });
});
