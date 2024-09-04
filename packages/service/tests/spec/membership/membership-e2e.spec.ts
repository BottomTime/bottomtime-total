import { AccountTier, UserRole } from '@bottomtime/api';

import { SQSClient } from '@aws-sdk/client-sqs';
import { INestApplication } from '@nestjs/common';

import Stripe from 'stripe';
import request from 'supertest';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import {
  StripeCustomerProMember,
  StripeEntitlementsPro,
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

    app = await createTestApp({ sqsClient, stripe });
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
      expect(emailSpy).toHaveBeenCalledWith({});

      // TODO: Mock SQS queue and verify that email was sent
    });
  });
});
