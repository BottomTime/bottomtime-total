import {
  AccountTier,
  ApiClient,
  BillingFrequency,
  HttpException,
  MembershipStatus,
  MembershipStatusDTO,
} from '@bottomtime/api';

import {
  ConfirmPaymentData,
  PaymentIntentResult,
  Stripe,
  StripeElements,
  StripeElementsOptionsClientSecret,
  StripePaymentElement,
} from '@stripe/stripe-js';
import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { It, Mock, Times } from 'moq.ts';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import MembershipPayment from '../../../../../src/components/users/membership/membership-payment.vue';
import { StripeLoaderKey } from '../../../../../src/stripe';
import { createRouter } from '../../../../fixtures/create-router';
import { BasicUser } from '../../../../fixtures/users';

type ConfirmPaymentOptions = {
  elements: StripeElements;
  confirmParams: ConfirmPaymentData;
  redirect?: 'always';
};

const ClientSecret = 'jVeDP4Ctt7iQlhuGRz-rWg-zAzkAxmc9vjo-rDfz4ms';

const NoMembership: MembershipStatusDTO = {
  accountTier: AccountTier.Basic,
  status: MembershipStatus.None,
  entitlements: [],
} as const;

describe('MembershipPayment component', () => {
  let client: ApiClient;
  let router: Router;
  let stripe: Mock<Stripe>;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof MembershipPayment>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    stripe = new Mock<Stripe>();
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
      props: {
        user: { ...BasicUser },
        membershipStatus: NoMembership,
      },
    };
  });

  it('will inform the user if they are on a free account and have not initiated a subscription yet', async () => {
    jest.spyOn(client.memberships, 'createSession').mockRejectedValue(
      new HttpException(400, 'Nope', 'What subscription?', {
        message: 'No subscription',
        method: 'POST',
        path: '/api/memberships/session',
        status: 400,
      }),
    );
    const wrapper = mount(MembershipPayment, opts);
    await flushPromises();

    expect(
      wrapper.find('[data-testid="no-membership-message"]').isVisible(),
    ).toBe(true);
  });

  it('will load the user payment session and render the Stripe component(s)', async () => {
    const spy = jest
      .spyOn(client.memberships, 'createSession')
      .mockResolvedValue({
        clientSecret: ClientSecret,
        currency: 'cad',
        frequency: BillingFrequency.Month,
        products: [
          {
            price: 9.99,
            product: 'Pro Membership',
          },
        ],
        total: 10.99,
        tax: 1.0,
      });
    const paymentElement = new Mock<StripePaymentElement>()
      .setup((x) => x.mount(It.IsAny()))
      .returns();
    const elements = new Mock<StripeElements>()
      .setup((x) => x.create('payment', It.IsAny()))
      .returns(paymentElement.object());
    stripe
      .setup((x) => x.elements(It.IsAny<StripeElementsOptionsClientSecret>()))
      .returns(elements.object());

    const wrapper = mount(MembershipPayment, opts);
    expect(wrapper.find('div#payment-shim').isVisible()).toBe(true);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username);
    stripe.verify(
      (x) =>
        x.elements(
          It.Is<StripeElementsOptionsClientSecret>(
            (opts) => opts.clientSecret === ClientSecret,
          ),
        ),
      Times.Once(),
    );
    paymentElement.verify((x) => x.mount('#payment-shim'), Times.Once());

    expect(
      wrapper.get('[data-testid="payment-message"]').text(),
    ).toMatchSnapshot();
    expect(
      wrapper.get('[data-testid="payment-invoice"]').text(),
    ).toMatchSnapshot();
  });

  it('will handle confirmation and redirect to the membership confirmation page', async () => {
    jest.spyOn(client.memberships, 'createSession').mockResolvedValue({
      clientSecret: ClientSecret,
      currency: 'cad',
      frequency: BillingFrequency.Month,
      products: [
        {
          price: 9.99,
          product: 'Pro Membership',
        },
      ],
      total: 10.99,
      tax: 1.0,
    });
    const paymentElement = new Mock<StripePaymentElement>()
      .setup((x) => x.mount(It.IsAny()))
      .returns();
    const elements = new Mock<StripeElements>()
      .setup((x) => x.create('payment', It.IsAny()))
      .returns(paymentElement.object());
    stripe
      .setup((x) => x.elements(It.IsAny<StripeElementsOptionsClientSecret>()))
      .returns(elements.object());
    stripe
      .setup((x) => x.confirmPayment(It.IsAny()))
      .returnsAsync({} as PaymentIntentResult);

    const wrapper = mount(MembershipPayment, opts);
    await flushPromises();

    await wrapper.get('[data-testid="btn-submit-payment"]').trigger('click');

    stripe.verify(
      (x) =>
        x.confirmPayment(
          It.Is((opts: ConfirmPaymentOptions) =>
            opts.confirmParams.return_url.endsWith('/membership/confirmation'),
          ),
        ),
      Times.Once(),
    );
  });

  it('will display a message if Stripe payment confirmation fails', async () => {
    const error = 'Hell nah.';
    jest.spyOn(client.memberships, 'createSession').mockResolvedValue({
      clientSecret: ClientSecret,
      currency: 'cad',
      frequency: BillingFrequency.Month,
      products: [
        {
          price: 9.99,
          product: 'Pro Membership',
        },
      ],
      total: 10.99,
      tax: 1.0,
    });
    const paymentElement = new Mock<StripePaymentElement>()
      .setup((x) => x.mount(It.IsAny()))
      .returns();
    const elements = new Mock<StripeElements>()
      .setup((x) => x.create('payment', It.IsAny()))
      .returns(paymentElement.object());
    stripe
      .setup((x) => x.elements(It.IsAny<StripeElementsOptionsClientSecret>()))
      .returns(elements.object());
    stripe
      .setup((x) => x.confirmPayment(It.IsAny()))
      .returnsAsync({
        error: {
          message: error,
          type: 'card_error',
        },
      });

    const wrapper = mount(MembershipPayment, opts);
    await flushPromises();

    await wrapper.get('[data-testid="btn-submit-payment"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="payment-error"]').text()).toBe(error);
  });
});
