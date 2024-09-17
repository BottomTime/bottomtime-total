import { AccountTier } from '@bottomtime/api';

import { BadRequestException } from '@nestjs/common';

import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { StripeWebhookService } from '../../../src/membership/stripe-webhook.service';
import { UsersService } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  StripeInvoiceCreatedEvent,
  StripeInvoiceFinalizedEvent,
  StripeInvoicePaymentSucceededEvent,
  StripePaymentActionRequiredEvent,
  StripePaymentFailedEvent,
  StripeSubscriptionCanceledEvent,
  StripeTrialWillEndEvent,
  getEntitlementsChangedEvent,
} from '../../fixtures/stripe-events';
import { TestQueue, createTestUser } from '../../utils';

const TestSignature = 'SuperSecretSignature';
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
    jest
      .spyOn(stripe.webhooks, 'constructEventAsync')
      .mockImplementation(async (payload, signature) => {
        if (typeof payload !== 'string') payload = payload.toString('utf-8');

        if (signature === TestSignature) {
          return JSON.parse(payload);
        }

        throw new Error('Invalid signature');
      });
  });

  afterEach(() => {
    emailQueue.clear();
  });

  it('will throw a BadRequestException if the signature is invalid', async () => {
    await Users.save(userData);
    await expect(
      service.handleWebhookEvent(
        JSON.stringify(StripeSubscriptionCanceledEvent),
        'InvalidSignature',
      ),
    ).rejects.toThrow(BadRequestException);

    const saved = await Users.findOneByOrFail({ id: UserId });
    expect(saved.accountTier).toBe(AccountTier.Pro);
    expect(emailQueue.messages).toHaveLength(0);
  });

  it('will throw a BadRequestException if the customer ID cannot be mapped back to a user', async () => {
    const event = {
      ...getEntitlementsChangedEvent(AccountTier.ShopOwner),
    };
    Object.assign(event.data.object, { customer: 'cus_InvalidCustomerID' });

    await expect(
      service.handleWebhookEvent(JSON.stringify(event), TestSignature),
    ).rejects.toThrow(BadRequestException);
  });

  it('will throw a BadRequestException if customer is missing from payload', async () => {
    const event = {
      ...getEntitlementsChangedEvent(AccountTier.ShopOwner),
    };
    Object.assign(event.data.object, { customer: null });

    await expect(
      service.handleWebhookEvent(JSON.stringify(event), TestSignature),
    ).rejects.toThrow(BadRequestException);
  });

  it('will fail silently if the received event has no mapped handler', async () => {
    await service.handleWebhookEvent(
      JSON.stringify(StripeInvoicePaymentSucceededEvent),
      TestSignature,
    );
  });

  it('will fail silently if an email cannot be queued', async () => {
    const spy = jest
      .spyOn(emailQueue, 'add')
      .mockRejectedValueOnce(new Error('Failed to queue email'));
    await Users.save(userData);

    await service.handleWebhookEvent(
      JSON.stringify(StripeSubscriptionCanceledEvent),
      TestSignature,
    );

    expect(spy).toHaveBeenCalled();
  });

  it('will handle a membership cancelation event', async () => {
    userData.accountTier = AccountTier.Pro;
    await Users.save(userData);

    await service.handleWebhookEvent(
      JSON.stringify(StripeSubscriptionCanceledEvent),
      TestSignature,
    );

    // Account will not be downgraded as a result of this event.
    // The account will be downgraded as a result of the user's entitlements changing.
    const saved = await Users.findOneByOrFail({ id: UserId });
    expect(saved.accountTier).toBe(AccountTier.Pro);

    expect(emailQueue.messages).toHaveLength(1);
    expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
  });

  describe('when handling entitlements changes', () => {
    it('will handle a change in account tier', async () => {
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.ShopOwner)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.ShopOwner);
      expect(emailQueue.messages).toHaveLength(1);
      expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
    });

    it('will handle a new membership activation', async () => {
      userData.accountTier = AccountTier.Basic;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.Pro)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(emailQueue.messages).toHaveLength(1);
      expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
    });

    it('will handle a membership cancelation', async () => {
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.Basic)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Basic);
      expect(emailQueue.messages).toHaveLength(0);
    });

    it('will do nothing if the entitlement changes do not indicate a change to account tier', async () => {
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.Pro)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(emailQueue.messages).toHaveLength(0);
    });
  });

  describe('when handling invoice events', () => {
    it('will finalize an invoice on creation', async () => {
      const finalizeSpy = jest
        .spyOn(stripe.invoices, 'finalizeInvoice')
        .mockResolvedValueOnce({} as Stripe.Response<Stripe.Invoice>);

      await service.handleWebhookEvent(
        JSON.stringify(StripeInvoiceCreatedEvent),
        TestSignature,
      );

      expect(finalizeSpy).toHaveBeenCalledWith(
        StripeInvoiceCreatedEvent.data.object.id,
        { auto_advance: true },
      );
    });

    it('will handle an invoice finalized event', async () => {
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(StripeInvoiceFinalizedEvent),
        TestSignature,
      );

      expect(emailQueue.messages).toHaveLength(1);
      expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
    });
  });

  describe('when handling payment issue events', () => {
    it('will handle an action required event', async () => {
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(StripePaymentActionRequiredEvent),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(emailQueue.messages).toHaveLength(1);
      expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
    });

    it('will handle a payment failed event', async () => {
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(StripePaymentFailedEvent),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(emailQueue.messages).toHaveLength(1);
      expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
    });
  });

  it('will handle a trial-will-end event', async () => {
    userData.accountTier = AccountTier.Pro;
    await Users.save(userData);

    await service.handleWebhookEvent(
      JSON.stringify(StripeTrialWillEndEvent),
      TestSignature,
    );

    const saved = await Users.findOneByOrFail({ id: UserId });
    expect(saved.accountTier).toBe(AccountTier.Pro);
    expect(emailQueue.messages).toHaveLength(1);
    expect(JSON.parse(emailQueue.messages[0])).toMatchSnapshot();
  });
});
