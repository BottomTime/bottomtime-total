import {
  AccountTier,
  ApiClient,
  BillingFrequency,
  ListMembershipsResponseDTO,
  MembershipStatus,
  MembershipStatusDTO,
  UserDTO,
} from '@bottomtime/api';

import { PaymentIntent, Stripe } from '@stripe/stripe-js';
import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Mock } from 'moq.ts';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import LoadingSpinner from '../../../../src/components/common/loading-spinner.vue';
import MembershipPayment from '../../../../src/components/users/membership/membership-payment.vue';
import { useCurrentUser } from '../../../../src/store';
import { StripeLoaderKey } from '../../../../src/stripe';
import MembershipConfirmationView from '../../../../src/views/users/membership-confirmation-view.vue';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const MembershipOptions: ListMembershipsResponseDTO = [
  {
    accountTier: AccountTier.Basic,
    currency: 'CAD',
    frequency: BillingFrequency.Month,
    price: 0,
    name: 'Free Tier',
    description: 'This is the free tier',
    marketingFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  {
    accountTier: AccountTier.Pro,
    currency: 'CAD',
    frequency: BillingFrequency.Year,
    price: 99.99,
    name: 'Pro Tier',
    description: 'This is the pro tier',
    marketingFeatures: ['Feature 4', 'Feature 5', 'Feature 6'],
  },
  {
    accountTier: AccountTier.ShopOwner,
    currency: 'CAD',
    frequency: BillingFrequency.Month,
    price: 49.99,
    name: 'Shop Owner Tier',
    description: 'This is the shop owner tier',
    marketingFeatures: ['Feature 7', 'Feature 8', 'Feature 9'],
  },
];

const ProMembership: MembershipStatusDTO = {
  accountTier: AccountTier.Pro,
  status: MembershipStatus.Active,
  entitlements: ['pro'],
  nextBillingDate: new Date('2025-01-22').valueOf(),
};

const NoMembership: MembershipStatusDTO = {
  accountTier: AccountTier.Basic,
  status: MembershipStatus.None,
  entitlements: [],
} as const;

const PendingMembership: MembershipStatusDTO = {
  accountTier: AccountTier.Pro,
  status: MembershipStatus.Incomplete,
  entitlements: ['pro'],
};

const ProUser: UserDTO = {
  ...BasicUser,
  accountTier: AccountTier.Pro,
  profile: {
    ...BasicUser.profile,
    accountTier: AccountTier.Pro,
  },
} as const;

describe('Membership Confirmation View', () => {
  let client: ApiClient;
  let router: Router;
  let stripe: Mock<Stripe>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof MembershipConfirmationView>;

  beforeAll(async () => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/account',
        component: { template: '' },
      },
      {
        path: '/membership/confirmation',
        name: 'MembershipConfirmation',
        component: MembershipConfirmationView,
      },
    ]);
  });

  beforeEach(async () => {
    jest.useFakeTimers({
      doNotFake: ['setImmediate', 'nextTick'],
      now: new Date('2024-10-28T08:33:30Z'),
    });
    stripe = new Mock<Stripe>();
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [StripeLoaderKey as symbol]: {
            loadStripe: () => Promise.resolve(stripe.object()),
          },
        },
      },
    };

    jest
      .spyOn(client.memberships, 'listMemberships')
      .mockResolvedValue(MembershipOptions);
    await router.push('/membership/confirmation');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will render login form if user is not logged in', async () => {
    currentUser.user = null;
    const spy = jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(NoMembership);
    const wrapper = mount(MembershipConfirmationView, opts);
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it('will initially mount with loading spinner', () => {
    currentUser.user = ProUser;
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(NoMembership);
    const wrapper = mount(MembershipConfirmationView, opts);
    expect(wrapper.findComponent(LoadingSpinner).isVisible()).toBe(true);
  });

  it('will display a message if the current membership is already active', async () => {
    currentUser.user = ProUser;
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(ProMembership);
    const wrapper = mount(MembershipConfirmationView, opts);
    await flushPromises();

    expect(
      wrapper.find('[data-testid="active-membership-tier"]>p').text(),
    ).toBe(MembershipOptions[1].name);
  });

  it('will redirect back to account page after timer runs out', async () => {
    currentUser.user = ProUser;
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(ProMembership);
    mount(MembershipConfirmationView, opts);
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/membership/confirmation');

    jest.runAllTimers();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/account');
  });

  it('will allow user to return to account page by clicking button', async () => {
    currentUser.user = ProUser;
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(ProMembership);
    const wrapper = mount(MembershipConfirmationView, opts);
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/membership/confirmation');

    await wrapper.get('[data-testid="btn-return-to-account"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/account');
  });

  it('will prompt for payment if membership status is in an incomplete state', async () => {
    currentUser.user = BasicUser;
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(PendingMembership);
    const wrapper = mount(MembershipConfirmationView, opts);
    await flushPromises();

    const payment = wrapper.getComponent(MembershipPayment);
    expect(payment.isVisible()).toBe(true);
    expect(payment.props('membershipStatus')).toEqual(PendingMembership);
    expect(payment.props('user')).toEqual(BasicUser);
  });

  describe('when handling redirect from Stripe', () => {
    const ClientSecret =
      'pi_3QEvqcI1ADsIvyhF1WQQXVeX_secret_dApbOaFv4tI4ojlVVGLn2yTKa';

    beforeEach(async () => {
      await router.push({
        path: '/membership/confirmation',
        query: {
          payment_intent: 'pi_3QEvqcI1ADsIvyhF1WQQXVeX',
          payment_intent_client_secret: ClientSecret,
          redirect_status: 'succeeded',
        },
      });
      currentUser.user = BasicUser;
      jest
        .spyOn(client.memberships, 'getMembershipStatus')
        .mockResolvedValue(PendingMembership);
    });

    it('will indicate a successful payment', async () => {
      stripe
        .setup((x) => x.retrievePaymentIntent(ClientSecret))
        .returnsAsync({
          paymentIntent: { status: 'succeeded' } as PaymentIntent,
        });
      const wrapper = mount(MembershipConfirmationView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="active-membership-tier"]').text(),
      ).toMatchSnapshot();
    });

    it('will use incremental back-off to check for payment status when things are slow', async () => {
      stripe
        .setup((x) => x.retrievePaymentIntent(ClientSecret))
        .returnsAsync({
          paymentIntent: { status: 'processing' } as PaymentIntent,
        });
      const wrapper = mount(MembershipConfirmationView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="loading-message"]').text(),
      ).toMatchSnapshot();
    });

    it('will render the payment form if the payment is still incomplete', async () => {
      stripe
        .setup((x) => x.retrievePaymentIntent(ClientSecret))
        .returnsAsync({
          paymentIntent: { status: 'requires_payment_method' } as PaymentIntent,
        });
      const wrapper = mount(MembershipConfirmationView, opts);
      await flushPromises();

      expect(wrapper.findComponent(MembershipPayment).isVisible()).toBe(true);
    });

    it.todo('Other states?');
  });
});
