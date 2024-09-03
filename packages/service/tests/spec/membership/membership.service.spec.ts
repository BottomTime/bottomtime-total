import { AccountTier, UserRole } from '@bottomtime/api';

import { ForbiddenException } from '@nestjs/common';

import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { MembershipService } from '../../../src/membership/membership.service';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  StripeCustomerNonMember,
  StripeCustomerProMember,
  StripeEntitlementsNone,
  StripeEntitlementsPro,
  StripePriceData,
} from '../../fixtures/stripe';
import { createTestUser } from '../../utils/create-test-user';

const UserData: Partial<UserEntity> = {
  id: '584a838a-4672-4a14-8e04-03e58e83e069',
  email: 'geoff_jones@email.org',
  emailLowered: 'geoff_jones@email.org',
  emailVerified: true,
  username: 'geoff_jones',
  usernameLowered: 'geoff_jones',
  name: 'Geoff Jones',
  role: UserRole.User,
  accountTier: AccountTier.Basic,
  stripeCustomerId: 'cus_QguMZ6wdt2TTlK',
};

describe('MembershipService class', () => {
  let Users: Repository<UserEntity>;
  let stripe: Stripe;
  let service: MembershipService;

  let userData: UserEntity;
  let user: User;

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);

    /* eslint-disable-next-line no-process-env */
    stripe = new Stripe(
      'sk_test_51PktwnI1ADsIvyhFSnAbMv2qbbqNjmU8NUS5EG3Gk1qvICgmWLgfeQiQRitwpI942PMbenA2X09W00QP7lUxztnx00dxXmdIw5',
    );
    service = new MembershipService(stripe);
    jest.spyOn(stripe.prices, 'list').mockResolvedValue(StripePriceData);

    // const customer = await stripe.customers.retrieve('cus_QguMZ6wdt2TTlK', {
    //   expand: ['subscriptions'],
    // });
    // console.log(JSON.stringify(customer, null, 2));

    // const entitlements = await stripe.entitlements.activeEntitlements.list({
    //   customer: 'cus_QguMZ6wdt2TTlK',
    // });
    // console.log(JSON.stringify(entitlements, null, 2));

    await service.onModuleInit();
  });

  beforeEach(() => {
    userData = createTestUser(UserData);
    user = new User(Users, userData);
  });

  it('will retrieve a list of available membership tiers', async () => {
    const products = await service.listMemberships();
    expect(products).toMatchSnapshot();
  });

  describe('when retrieving membership status for a user', () => {
    it('will return a non-membership response if user does not have a customer ID', async () => {
      userData.stripeCustomerId = null;
      const status = await service.getMembershipStatus(user);
      expect(status).toMatchSnapshot();
    });

    it('will return membership data if user has a Stripe customer but no active subscription', async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerNonMember);
      const entitlementsSpy = jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsNone);

      const status = await service.getMembershipStatus(user);
      expect(status).toMatchSnapshot();

      expect(customerSpy).toHaveBeenCalledWith(userData.stripeCustomerId, {
        expand: ['subscriptions'],
      });
      expect(entitlementsSpy).toHaveBeenCalledWith({
        customer: userData.stripeCustomerId,
      });
    });

    it('will return membership details if the user has an active membership', async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      const entitlementsSpy = jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsPro);

      const status = await service.getMembershipStatus(user);
      expect(status).toMatchSnapshot();

      expect(customerSpy).toHaveBeenCalledWith(userData.stripeCustomerId, {
        expand: ['subscriptions'],
      });
      expect(entitlementsSpy).toHaveBeenCalledWith({
        customer: userData.stripeCustomerId,
      });
    });
  });

  describe('when updating a membership', () => {
    it('will not allow users to create a membership unless their email is verified', async () => {
      userData.emailVerified = false;
      userData.accountTier = AccountTier.Basic;
      userData.stripeCustomerId = null;

      await expect(
        service.updateMembership(user, AccountTier.Pro),
      ).rejects.toThrow(ForbiddenException);
    });

    it('will provision Stripe for a new customer and create a membership', async () => {
      userData.accountTier = AccountTier.Basic;
      userData.stripeCustomerId = null;

      const newCustomerSpy = jest
        .spyOn(stripe.customers, 'create')
        .mockResolvedValue(StripeCustomerNonMember);
      const createSubscriptionSpy = jest
        .spyOn(stripe.subscriptions, 'create')
        .mockResolvedValue(
          StripeCustomerProMember.subscriptions!
            .data[0] as Stripe.Response<Stripe.Subscription>,
        );
      jest
        .spyOn(user, 'attachStripeCustomerId')
        .mockImplementation(async (customerId: string): Promise<void> => {
          userData.stripeCustomerId = customerId;
        });
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsPro);

      const membership = await service.updateMembership(user, AccountTier.Pro);
      expect(membership).toMatchSnapshot();

      expect(newCustomerSpy).toHaveBeenCalledWith({
        email: user.email,
        name: user.profile.name,
      });
      expect(createSubscriptionSpy).toHaveBeenCalledWith({
        customer: StripeCustomerNonMember.id,
        items: [
          {
            price: 'price_1PsovKI1ADsIvyhFdKdp73az',
            quantity: 1,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        collection_method: 'charge_automatically',
        proration_behavior: 'create_prorations',
        expand: ['latest_invoice.payment_intent'],
      });
    });

    it.skip('will provision a new membership for a user with an existing Stripe customer ID', async () => {
      const createSubscriptionSpy = jest
        .spyOn(stripe.subscriptions, 'create')
        .mockResolvedValue(
          StripeCustomerProMember.subscriptions!
            .data[0] as Stripe.Response<Stripe.Subscription>,
        );
      const getCustomerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerNonMember);
      jest
        .spyOn(user, 'attachStripeCustomerId')
        .mockImplementation(async (customerId: string): Promise<void> => {
          userData.stripeCustomerId = customerId;
        });
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsPro);

      const membership = await service.updateMembership(user, AccountTier.Pro);
      expect(membership).toMatchSnapshot();

      expect(getCustomerSpy).toHaveBeenCalledWith(StripeCustomerNonMember.id);
      expect(createSubscriptionSpy).toHaveBeenCalledWith({
        customer: StripeCustomerNonMember.id,
        items: [
          {
            price: 'price_1PsovKI1ADsIvyhFdKdp73az',
            quantity: 1,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        collection_method: 'charge_automatically',
        proration_behavior: 'create_prorations',
        expand: ['latest_invoice.payment_intent'],
      });
    });
  });

  describe('when cancelling a membership', () => {
    it('will do nothing if the user does not have a Stripe customer ID', async () => {
      userData.stripeCustomerId = null;
      await expect(service.cancelMembership(user)).resolves.toBe(false);
    });

    it('will do nothing if the user does not have an active membership', async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerNonMember);

      await expect(service.cancelMembership(user)).resolves.toBe(false);

      expect(customerSpy).toHaveBeenCalledWith(userData.stripeCustomerId, {
        expand: ['subscriptions'],
      });
    });

    it("will cancel a membership and update the user's account tier", async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      const cancelSpy = jest
        .spyOn(stripe.subscriptions, 'cancel')
        .mockResolvedValue(
          {} as unknown as Stripe.Response<Stripe.Subscription>,
        );
      const accountTierSpy = jest
        .spyOn(user, 'changeMembership')
        .mockResolvedValue();

      await expect(service.cancelMembership(user)).resolves.toBe(true);

      expect(customerSpy).toHaveBeenCalledWith(userData.stripeCustomerId, {
        expand: ['subscriptions'],
      });
      expect(cancelSpy).toHaveBeenCalledWith(
        StripeCustomerProMember.subscriptions!.data[0].id,
        {
          prorate: true,
          invoice_now: true,
        },
      );
      expect(accountTierSpy).toHaveBeenCalledWith(AccountTier.Basic);
    });
  });
});
