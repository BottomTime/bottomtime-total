import { AccountTier, UserRole } from '@bottomtime/api';

import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

import Stripe from 'stripe';

import { UserEntity } from '../../../src/data';
import { MembershipService } from '../../../src/membership/membership.service';
import { User, UserFactory } from '../../../src/users';
import {
  StripeCustomerCompleteMembership,
  StripeCustomerDeleted,
  StripeCustomerIncompleteMembership,
  StripeCustomerNonMember,
  StripeCustomerProMember,
  StripeCustomerShopOwnerMember,
  StripeEntitlementsNone,
  StripeEntitlementsPro,
  StripeEntitlementsShopOwner,
  StripePriceData,
} from '../../fixtures/stripe';
import { createUserFactory } from '../../utils';
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
  let stripe: Stripe;
  let service: MembershipService;
  let userFactory: UserFactory;

  let userData: UserEntity;
  let user: User;

  beforeAll(async () => {
    userFactory = createUserFactory();

    /* eslint-disable-next-line no-process-env */
    stripe = new Stripe('sk_test_xxxxx');
    service = new MembershipService(stripe);
    jest.spyOn(stripe.prices, 'list').mockResolvedValue(StripePriceData);

    await service.onModuleInit();
  });

  beforeEach(() => {
    userData = createTestUser(UserData);
    user = userFactory.createUser(userData);
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

    it('will return membership status for a deleted Stripe customer', async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerDeleted);
      const entitlementsSpy = jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsNone);

      const status = await service.getMembershipStatus(user);
      expect(status).toMatchSnapshot();

      expect(customerSpy).toHaveBeenCalledWith(userData.stripeCustomerId, {
        expand: ['subscriptions'],
      });
      expect(entitlementsSpy).not.toHaveBeenCalled();
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

    it('will provision a new membership for a user with an existing Stripe customer ID', async () => {
      const getCustomerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValueOnce(StripeCustomerNonMember);
      getCustomerSpy.mockResolvedValueOnce(StripeCustomerProMember);
      const createSubscriptionSpy = jest
        .spyOn(stripe.subscriptions, 'create')
        .mockResolvedValue(
          StripeCustomerProMember.subscriptions!
            .data[0] as Stripe.Response<Stripe.Subscription>,
        );
      const changeMembershipSpy = jest
        .spyOn(user, 'changeMembership')
        .mockImplementation(async (tier) => {
          userData.accountTier = tier;
        });
      const attachCustomerSpy = jest
        .spyOn(user, 'attachStripeCustomerId')
        .mockResolvedValue();
      jest

        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsPro);

      const membership = await service.updateMembership(user, AccountTier.Pro);
      expect(membership).toMatchSnapshot();
      expect(user.accountTier).toBe(AccountTier.Pro);

      expect(attachCustomerSpy).not.toHaveBeenCalled();
      expect(changeMembershipSpy).toHaveBeenCalledWith(AccountTier.Pro);
      expect(getCustomerSpy).toHaveBeenCalledTimes(2);
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

    it('will upgrade/downgrade a user to a different membership tier', async () => {
      userData.accountTier = AccountTier.Pro;
      const getCustomerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValueOnce(StripeCustomerProMember);
      getCustomerSpy.mockResolvedValueOnce(StripeCustomerShopOwnerMember);
      const changeSubscriptionSpy = jest
        .spyOn(stripe.subscriptions, 'update')
        .mockResolvedValue(
          StripeCustomerShopOwnerMember.subscriptions!
            .data[0] as Stripe.Response<Stripe.Subscription>,
        );
      const changeMembershipSpy = jest
        .spyOn(user, 'changeMembership')
        .mockResolvedValue();
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsShopOwner);

      const result = await service.updateMembership(
        user,
        AccountTier.ShopOwner,
      );
      expect(result).toMatchSnapshot();

      expect(changeMembershipSpy).toHaveBeenCalledWith(AccountTier.ShopOwner);
      expect(getCustomerSpy).toHaveBeenCalledTimes(2);
      expect(changeSubscriptionSpy).toHaveBeenCalledWith(
        'sub_1PtVMMI1ADsIvyhF61EcWHlG',
        {
          cancel_at_period_end: false,
          proration_behavior: 'create_prorations',
          items: [
            {
              id: 'si_Ql1PdoN67ZpOpB',
              price: 'price_1PsovKI1ADsIvyhFKcf9UONp',
            },
          ],
        },
      );
    });

    it('will cancel a subscription if downgrading do a free account', async () => {
      userData.accountTier = AccountTier.Pro;
      const getCustomerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValueOnce(StripeCustomerProMember);
      getCustomerSpy.mockResolvedValueOnce(StripeCustomerNonMember);
      const cancelSubscriptionSpy = jest
        .spyOn(stripe.subscriptions, 'cancel')
        .mockResolvedValue(
          {} as unknown as Stripe.Response<Stripe.Subscription>,
        );
      const changeMembershipSpy = jest
        .spyOn(user, 'changeMembership')
        .mockImplementation(async (tier) => {
          userData.accountTier = tier;
        });
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsNone);

      const result = await service.updateMembership(user, AccountTier.Basic);
      expect(result).toMatchSnapshot();
      expect(user.accountTier).toBe(AccountTier.Basic);

      expect(getCustomerSpy).toHaveBeenCalled();
      expect(cancelSubscriptionSpy).toHaveBeenCalledWith(
        StripeCustomerProMember.subscriptions!.data[0].id,
        {
          prorate: true,
          invoice_now: true,
        },
      );
      expect(changeMembershipSpy).toHaveBeenCalledWith(AccountTier.Basic);
    });

    it("will create a new Stripe customer if the user's original customer was deleted", async () => {
      userData.accountTier = AccountTier.Pro;
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerDeleted);
      const createSpy = jest
        .spyOn(stripe.customers, 'create')
        .mockResolvedValue(StripeCustomerProMember);
      const updateSpy = jest
        .spyOn(stripe.subscriptions, 'update')
        .mockResolvedValue({} as Stripe.Response<Stripe.Subscription>);

      await service.updateMembership(user, AccountTier.ShopOwner);
      expect(createSpy).toHaveBeenCalledWith({
        email: user.email,
        name: user.profile.name,
      });
      expect(updateSpy).toHaveBeenCalled();
    });

    it('will perform a no-op if the user is already at the requested account tier', async () => {
      userData.accountTier = AccountTier.Pro;
      const getCustomerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      const changeMembershipSpy = jest.spyOn(user, 'changeMembership');
      const updateSubscriptionSpy = jest.spyOn(stripe.subscriptions, 'update');
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsPro);

      const result = await service.updateMembership(user, AccountTier.Pro);
      expect(result).toMatchSnapshot();

      expect(getCustomerSpy).toHaveBeenCalled();
      expect(changeMembershipSpy).not.toHaveBeenCalled();
      expect(updateSubscriptionSpy).not.toHaveBeenCalled();
    });
  });

  describe('when creating a payment session for a new memberhsip', () => {
    it('will return undefined if the user does not yet have an attached Stripe customer', async () => {
      userData.stripeCustomerId = null;
      await expect(service.createPaymentSession(user)).resolves.toBeUndefined();
    });

    it('will throw an exception if Stripe customer is deleted', async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerDeleted);
      await expect(service.createPaymentSession(user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('will return undefined if user does not have a subscription', async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerNonMember);
      await expect(service.createPaymentSession(user)).resolves.toBeUndefined();
    });

    it('will return a client secret if user already has an active subscription', async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerCompleteMembership);
      const session = await service.createPaymentSession(user);
      expect(session).toMatchSnapshot();
    });

    it('will return a client secret for a payment session for a user with a subscription', async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerIncompleteMembership);

      const session = await service.createPaymentSession(user);
      expect(session).toMatchSnapshot();
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

    it('will throw an exception if the Stripe customer was deleted', async () => {
      userData.accountTier = AccountTier.ShopOwner;
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerDeleted);

      await expect(service.cancelMembership(user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
