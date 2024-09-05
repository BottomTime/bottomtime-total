import { AccountTier, UserRole } from '@bottomtime/api';

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { INestApplication } from '@nestjs/common';

import Stripe from 'stripe';
import request from 'supertest';
import { Repository } from 'typeorm';

import { Queues } from '../../../src/common';
import { UserEntity } from '../../../src/data';
import { StripeModule } from '../../../src/dependencies';
import { MembershipController } from '../../../src/membership/membership.controller';
import { MembershipService } from '../../../src/membership/membership.service';
import { MembershipsController } from '../../../src/membership/memberships.controller';
import { QueueModule } from '../../../src/queue';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  StripeCustomerIncompleteMembership,
  StripeCustomerNonMember,
  StripeCustomerProMember,
  StripeCustomerShopOwnerMember,
  StripeEntitlementsPro,
  StripeEntitlementsShopOwner,
  StripePriceData,
} from '../../fixtures/stripe';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';

const RegularUserData: Partial<UserEntity> = {
  id: '8e164228-06b2-4c6a-82b8-82b3a9d4b438',
  role: UserRole.User,
  email: 'gil@email.org',
  emailLowered: 'gil@email.org',
  emailVerified: true,
  username: 'gil',
  usernameLowered: 'gil',
  name: 'Gil McGoo',
  accountTier: AccountTier.Basic,
  stripeCustomerId: 'cus_QmXFUbI33k0i4V',
} as const;

const AdminUserData: Partial<UserEntity> = {
  id: '13710774-df5e-4bf2-a3ed-d489baaadb16',
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
} as const;

const OtherUserData: Partial<UserEntity> = {
  id: '70e4ff0a-e2de-42da-8a3e-323d517c425f',
  role: UserRole.User,
  email: 'sean@email.org',
  emailLowered: 'sean@email.org',
  emailVerified: true,
  username: 'sean',
  usernameLowered: 'sean',
  accountTier: AccountTier.Basic,
  stripeCustomerId: 'cus_QguMZ6wdt2TTlK',
};

function getUrl(username: string): string {
  return `/api/membership/${username}`;
}

function getSessionUrl(username: string): string {
  return `${getUrl(username)}/session`;
}

describe('Memberships E2E tests', () => {
  let stripe: Stripe;
  let app: INestApplication;
  let server: unknown;
  let sqsClient: SQSClient;

  let Users: Repository<UserEntity>;

  let regularUser: UserEntity;
  let regularAuthHeader: [string, string];

  let adminUser: UserEntity;
  let adminAuthHeader: [string, string];

  let otherUser: UserEntity;
  let otherAuthHeader: [string, string];

  beforeAll(async () => {
    sqsClient = new SQSClient();
    stripe = new Stripe('sk_test_xxxxx');
    jest.spyOn(stripe.prices, 'list').mockResolvedValue(StripePriceData);

    // app = await createTestApp({ sqsClient, stripe });
    app = await createTestApp(
      {
        imports: [
          QueueModule.forFeature({
            key: Queues.email,
            queueUrl: 'https://localhost:4566/MyQueue',
          }),
          StripeModule,
          UsersModule,
        ],
        providers: [MembershipService],
        controllers: [MembershipsController, MembershipController],
      },
      {
        provide: SQSClient,
        use: sqsClient,
      },
      {
        provide: Stripe,
        use: stripe,
      },
    );
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);

    [regularAuthHeader, adminAuthHeader, otherAuthHeader] = await Promise.all([
      createAuthHeader(RegularUserData.id!),
      createAuthHeader(AdminUserData.id!),
      createAuthHeader(OtherUserData.id!),
    ]);
  });

  beforeEach(async () => {
    regularUser = createTestUser(RegularUserData);
    adminUser = createTestUser(AdminUserData);
    otherUser = createTestUser(OtherUserData);
    await Users.save([regularUser, adminUser, otherUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('will request a list of memberships', async () => {
    const { body: result } = await request(server)
      .get('/api/membership')
      .expect(200);
    expect(result).toMatchSnapshot();
  });

  describe('when retrieving membership status', () => {
    it('will return membership status for a user', async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsPro);

      const { body: result } = await request(server)
        .get(getUrl(regularUser.username))
        .set(...regularAuthHeader)
        .expect(200);

      expect(result).toMatchSnapshot();
    });

    it("will allow an admin to retrieve a user's membership status", async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerShopOwnerMember);
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsShopOwner);

      const { body: result } = await request(server)
        .get(getUrl(regularUser.username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(result).toMatchSnapshot();
    });

    it('will return a 401 response if user is not authenticated', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server).get(getUrl(regularUser.username)).expect(401);
      expect(spy).not.toHaveBeenCalled();
    });

    it('will return a 403 response if user is not authorized', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server)
        .get(getUrl(regularUser.username))
        .set(...otherAuthHeader)
        .expect(403);
      expect(spy).not.toHaveBeenCalled();
    });

    it('will return a 404 response if requested user does not exist', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server)
        .get(getUrl('nobody'))
        .set(...adminAuthHeader)
        .expect(404);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when cancelling a membership', () => {
    it('will cancel a membership and send an email', async () => {
      regularUser.accountTier = AccountTier.Pro;
      await Users.save(regularUser);

      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      const cancelSpy = jest
        .spyOn(stripe.subscriptions, 'cancel')
        .mockResolvedValue({} as Stripe.Response<Stripe.Subscription>);
      const emailSpy = jest.spyOn(sqsClient, 'send');

      await request(server)
        .delete(getUrl(regularUser.username))
        .set(...regularAuthHeader)
        .expect(204);

      const saved = await Users.findOneByOrFail({ id: regularUser.id });
      expect(cancelSpy).toHaveBeenCalled();
      expect(saved.accountTier).toBe(AccountTier.Basic);
      expect(emailSpy).toHaveBeenCalled();

      expect(
        (emailSpy.mock.calls[0][0] as SendMessageCommand).input.MessageBody,
      ).toMatchSnapshot();
    });

    it('will allow an admin to cancel a membership', async () => {
      regularUser.accountTier = AccountTier.Pro;
      await Users.save(regularUser);

      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerShopOwnerMember);
      const cancelSpy = jest
        .spyOn(stripe.subscriptions, 'cancel')
        .mockResolvedValue({} as Stripe.Response<Stripe.Subscription>);
      const emailSpy = jest.spyOn(sqsClient, 'send');

      await request(server)
        .delete(getUrl(regularUser.username))
        .set(...adminAuthHeader)
        .expect(204);

      const saved = await Users.findOneByOrFail({ id: regularUser.id });
      expect(cancelSpy).toHaveBeenCalled();
      expect(saved.accountTier).toBe(AccountTier.Basic);
      expect(emailSpy).toHaveBeenCalled();
    });

    it('will do nothing if the user has no membership', async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerNonMember);
      const cancelSpy = jest
        .spyOn(stripe.subscriptions, 'cancel')
        .mockResolvedValue({} as Stripe.Response<Stripe.Subscription>);
      const emailSpy = jest.spyOn(sqsClient, 'send');

      await request(server)
        .delete(getUrl(regularUser.username))
        .set(...regularAuthHeader)
        .expect(204);

      const saved = await Users.findOneByOrFail({ id: regularUser.id });
      expect(cancelSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(saved.accountTier).toBe(AccountTier.Basic);
    });

    it('will return a 401 response if user is not authenticated', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server).delete(getUrl(regularUser.username)).expect(401);
      expect(spy).not.toHaveBeenCalled();
    });

    it('will return a 403 response if user is not authorized', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server)
        .delete(getUrl(regularUser.username))
        .set(...otherAuthHeader)
        .expect(403);
      expect(spy).not.toHaveBeenCalled();
    });

    it('will return a 404 response if requested user does not exist', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server)
        .delete(getUrl('nobody'))
        .set(...adminAuthHeader)
        .expect(404);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when updating a membership', () => {
    it('will allow a user to update their membership', async () => {
      regularUser.accountTier = AccountTier.Pro;
      await Users.save(regularUser);

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
      const emailSpy = jest.spyOn(sqsClient, 'send');
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsShopOwner);

      const { body: result } = await request(server)
        .put(getUrl(regularUser.username))
        .set(...regularAuthHeader)
        .send({ newAccountTier: AccountTier.ShopOwner })
        .expect(200);
      expect(result).toMatchSnapshot();

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

      const saved = await Users.findOneByOrFail({ id: regularUser.id });
      expect(saved.accountTier).toBe(AccountTier.ShopOwner);
      expect(emailSpy).toHaveBeenCalled();
      expect(
        (emailSpy.mock.calls[0][0] as SendMessageCommand).input.MessageBody,
      ).toMatchSnapshot();
    });

    it('will allow a user to cancel a membership by way of update', async () => {
      regularUser.accountTier = AccountTier.Pro;
      await Users.save(regularUser);

      const getCustomerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValueOnce(StripeCustomerProMember);
      getCustomerSpy.mockResolvedValueOnce(StripeCustomerNonMember);
      const cancelSubscriptionSpy = jest
        .spyOn(stripe.subscriptions, 'cancel')
        .mockResolvedValue({} as Stripe.Response<Stripe.Subscription>);
      const emailSpy = jest.spyOn(sqsClient, 'send');
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsShopOwner);

      const { body: result } = await request(server)
        .put(getUrl(regularUser.username))
        .set(...regularAuthHeader)
        .send({ newAccountTier: AccountTier.Basic })
        .expect(200);
      expect(result).toMatchSnapshot();

      expect(getCustomerSpy).toHaveBeenCalledTimes(2);
      expect(cancelSubscriptionSpy).toHaveBeenCalledWith(
        'sub_1PtVMMI1ADsIvyhF61EcWHlG',
        { invoice_now: true, prorate: true },
      );

      const saved = await Users.findOneByOrFail({ id: regularUser.id });
      expect(saved.accountTier).toBe(AccountTier.Basic);
      expect(emailSpy).toHaveBeenCalled();
      expect(
        (emailSpy.mock.calls[0][0] as SendMessageCommand).input.MessageBody,
      ).toMatchSnapshot();
    });

    it("will allow an admin to update a user's membership", async () => {
      regularUser.accountTier = AccountTier.Pro;
      await Users.save(regularUser);

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
      const emailSpy = jest.spyOn(sqsClient, 'send');
      jest
        .spyOn(stripe.entitlements.activeEntitlements, 'list')
        .mockResolvedValue(StripeEntitlementsShopOwner);

      const { body: result } = await request(server)
        .put(getUrl(regularUser.username))
        .set(...adminAuthHeader)
        .send({ newAccountTier: AccountTier.ShopOwner })
        .expect(200);
      expect(result).toMatchSnapshot();

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

      const saved = await Users.findOneByOrFail({ id: regularUser.id });
      expect(saved.accountTier).toBe(AccountTier.ShopOwner);
      expect(emailSpy).toHaveBeenCalled();
      expect(
        (emailSpy.mock.calls[0][0] as SendMessageCommand).input.MessageBody,
      ).toMatchSnapshot();
    });

    it('will return a 401 response if user is not authenticated', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server)
        .put(getUrl(regularUser.username))
        .send({ newAccountTier: AccountTier.ShopOwner })
        .expect(401);
      expect(spy).not.toHaveBeenCalled();
    });

    it('will return a 403 response if user is not authorized', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server)
        .put(getUrl(regularUser.username))
        .set(...otherAuthHeader)
        .send({ newAccountTier: AccountTier.ShopOwner })
        .expect(403);
      expect(spy).not.toHaveBeenCalled();
    });

    it('will return a 404 response if requested user does not exist', async () => {
      const spy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerProMember);
      await request(server)
        .put(getUrl('nobody'))
        .set(...adminAuthHeader)
        .send({ newAccountTier: AccountTier.ShopOwner })
        .expect(404);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when creating a payment session', () => {
    it('will allow a user to create a payment session', async () => {
      jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerIncompleteMembership);

      const { body: result } = await request(server)
        .post(getSessionUrl(regularUser.username))
        .set(...regularAuthHeader)
        .expect(200);
      expect(result).toMatchSnapshot();
    });

    it('will return a 401 response if user is not authenticated', async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerIncompleteMembership);

      await request(server)
        .post(getSessionUrl(regularUser.username))
        .expect(401);

      expect(customerSpy).not.toHaveBeenCalled();
    });

    it('will return a 403 response if user is not authorized', async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerIncompleteMembership);

      await request(server)
        .post(getSessionUrl(regularUser.username))
        .set(...otherAuthHeader)
        .expect(403);

      expect(customerSpy).not.toHaveBeenCalled();
    });

    it('will return a 404 response if requested user does not exist', async () => {
      const customerSpy = jest
        .spyOn(stripe.customers, 'retrieve')
        .mockResolvedValue(StripeCustomerIncompleteMembership);

      await request(server)
        .post(getSessionUrl('nobody'))
        .set(...adminAuthHeader)
        .expect(404);

      expect(customerSpy).not.toHaveBeenCalled();
    });
  });
});
