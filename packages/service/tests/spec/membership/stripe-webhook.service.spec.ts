import { AccountTier } from '@bottomtime/api';

import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { StripeWebhookService } from '../../../src/membership/stripe-webhook.service';
import { UsersService } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  StripeSubscriptionCanceledEvent,
  StripeSubscriptionPausedEvent,
} from '../../fixtures/stripe-events';
import { TestQueue, createTestUser } from '../../utils';

const UserId = 'c07030c9-b650-480e-a5bb-510702ae0b09';
const UserData: Partial<UserEntity> = {
  id: UserId,
  accountTier: AccountTier.Pro,
  username: 'userman.32',
  usernameLowered: 'userman.32',
  email: 'user@email.com',
  emailLowered: 'user@email.com',
  emailVerified: true,
  name: 'User Man',
  stripeCustomerId: 'cus_QmXFUbI33k0i4V',
};

describe('Stripe webhook handler service', () => {
  let stripe: Stripe;
  let usersService: UsersService;
  let service: StripeWebhookService;

  let Users: Repository<UserEntity>;

  let emailQueue: TestQueue;
  let userData: UserEntity;

  beforeAll(() => {
    stripe = new Stripe('sk_test_xxxxx');
    Users = dataSource.getRepository(UserEntity);

    usersService = new UsersService(Users);
    emailQueue = new TestQueue();
    service = new StripeWebhookService(stripe, usersService, emailQueue);
  });

  beforeEach(async () => {
    userData = createTestUser(UserData);
  });

  afterEach(() => {
    emailQueue.clear();
  });

  it('will handle a subscription cancelation', async () => {
    await Users.save(userData);
    await service.onSubscriptionCanceled(StripeSubscriptionCanceledEvent);
    const saved = await Users.findOneByOrFail({ id: UserId });
    expect(saved.accountTier).toBe(AccountTier.Basic);
    expect(emailQueue.messages).toHaveLength(1);
    expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
  });

  it('will handle a subscription pause event', async () => {
    await Users.save(userData);
    await service.onSubscriptionPaused(StripeSubscriptionPausedEvent);
    const saved = await Users.findOneByOrFail({ id: UserId });
    expect(saved.accountTier).toBe(AccountTier.Basic);
  });
});
