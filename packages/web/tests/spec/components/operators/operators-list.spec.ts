import {
  AccountTier,
  SearchOperatorsResponseDTO,
  SearchOperatorsResponseSchema,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import OperatorsListItem from '../../../../src/components/operators/operators-list-item.vue';
import OperatorsList from '../../../../src/components/operators/operators-list.vue';
import { useCurrentUser } from '../../../../src/store';
import TestData from '../../../fixtures/dive-operators.json';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const CreateShopButton = '[data-testid="operators-create-shop"]';
const OperatorsCountText = '[data-testid="operators-count"]';
const NoResultsText = '[data-testid="operators-no-results"]';
const LoadMoreButton = '[data-testid="operators-load-more"]';

describe('OperatorsList component', () => {
  let currentUser: ReturnType<typeof useCurrentUser>;
  let testData: SearchOperatorsResponseDTO;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof OperatorsList>;

  beforeAll(() => {
    testData = SearchOperatorsResponseSchema.parse(TestData);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        operators: {
          operators: [],
          totalCount: 0,
        },
      },
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will render an empty list', () => {
    const wrapper = mount(OperatorsList, opts);
    expect(wrapper.find(NoResultsText).isVisible()).toBe(true);
    expect(wrapper.findAllComponents(OperatorsListItem)).toHaveLength(0);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.get(OperatorsCountText).text()).toBe(
      'Showing 0 of 0 dive shop(s)',
    );
  });

  it('will render a list of operators', () => {
    const length = 10;
    const wrapper = mount(OperatorsList, {
      ...opts,
      props: {
        operators: {
          operators: testData.operators.slice(0, length),
          totalCount: length,
        },
      },
    });
    expect(wrapper.find(NoResultsText).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.get(OperatorsCountText).text()).toBe(
      `Showing ${length} of ${length} dive shop(s)`,
    );

    const items = wrapper.findAllComponents(OperatorsListItem);
    expect(items).toHaveLength(length);

    items.forEach((item, index) => {
      expect(item.props('operator').name).toEqual(
        testData.operators[index].name,
      );
    });
  });

  it('will render a list of operators with option to load more', () => {
    const wrapper = mount(OperatorsList, {
      ...opts,
      props: {
        operators: testData,
      },
    });
    expect(wrapper.find(NoResultsText).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).isVisible()).toBe(true);
    expect(wrapper.get(OperatorsCountText).text()).toBe(
      `Showing ${testData.operators.length} of ${testData.totalCount} dive shop(s)`,
    );

    const items = wrapper.findAllComponents(OperatorsListItem);
    expect(items).toHaveLength(testData.operators.length);

    items.forEach((item, index) => {
      expect(item.props('operator').name).toEqual(
        testData.operators[index].name,
      );
    });
  });

  it('will show loading spinner when loading more flag is set', () => {
    const wrapper = mount(OperatorsList, {
      ...opts,
      props: {
        operators: testData,
        isLoadingMore: true,
      },
    });
    expect(wrapper.find(NoResultsText).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.find('[data-testid="operators-loading"]').isVisible()).toBe(
      true,
    );
  });

  it('will hide the "Create Shop" button for anonymous users', () => {
    const wrapper = mount(OperatorsList, opts);
    expect(wrapper.find(CreateShopButton).exists()).toBe(false);
  });

  it('will hide the "Create Shop" button for free tier members', () => {
    currentUser.user = {
      ...BasicUser,
      accountTier: AccountTier.Basic,
    };
    const wrapper = mount(OperatorsList, opts);
    expect(wrapper.find(CreateShopButton).exists()).toBe(false);
  });

  it('will hide the "Create Shop" button for pro tier members', () => {
    currentUser.user = {
      ...BasicUser,
      accountTier: AccountTier.Pro,
    };
    const wrapper = mount(OperatorsList, opts);
    expect(wrapper.find(CreateShopButton).exists()).toBe(false);
  });

  it('will show the "Create Shop" button for shop owner tier members', () => {
    currentUser.user = {
      ...BasicUser,
      accountTier: AccountTier.ShopOwner,
    };
    const wrapper = mount(OperatorsList, opts);
    expect(wrapper.find(CreateShopButton).isVisible()).toBe(true);
  });

  it('will show the "Create Shop" button for admins', () => {
    currentUser.user = AdminUser;
    const wrapper = mount(OperatorsList, opts);
    expect(wrapper.find(CreateShopButton).isVisible()).toBe(true);
  });

  it('will emit "create-shop" event when "Create Shop" button is clicked', async () => {
    currentUser.user = {
      ...BasicUser,
      accountTier: AccountTier.ShopOwner,
    };
    const wrapper = mount(OperatorsList, opts);
    await wrapper.get(CreateShopButton).trigger('click');
    expect(wrapper.emitted('create-shop')).toBeDefined();
  });

  it('will emit "load-more" event when "Load More" button is clicked', async () => {
    const wrapper = mount(OperatorsList, {
      ...opts,
      props: {
        operators: testData,
      },
    });
    await wrapper.get(LoadMoreButton).trigger('click');
    expect(wrapper.emitted('load-more')).toBeDefined();
  });

  it('will bubble up a "select" event when a dive operator is selected from the list', async () => {
    const wrapper = mount(OperatorsList, {
      ...opts,
      props: {
        operators: testData,
      },
    });
    const listItem = wrapper.findComponent(OperatorsListItem);
    listItem.vm.$emit('select', testData.operators[2]);
    expect(wrapper.emitted('select')).toEqual([[testData.operators[2]]]);
  });

  it('will bubble up a "delete" event when a delete button is clicked from the list', async () => {
    testData.operators[0].owner = BasicUser.profile;
    currentUser.user = BasicUser;
    const wrapper = mount(OperatorsList, {
      ...opts,
      props: {
        operators: testData,
      },
    });
    wrapper
      .findComponent(OperatorsListItem)
      .vm.$emit('delete', testData.operators[0]);
    expect(wrapper.emitted('delete')).toEqual([[testData.operators[0]]]);
  });
});
