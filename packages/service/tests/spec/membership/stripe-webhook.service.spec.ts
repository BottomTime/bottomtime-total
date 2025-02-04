import { AccountTier } from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import { BadRequestException } from '@nestjs/common';

import { It, Mock } from 'moq.ts';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { EventsService } from '../../../src/events';
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
import { createTestUser, createUserFactory } from '../../utils';

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

  let eventsService: EventsService;
  let userData: UserEntity;

  beforeAll(() => {
    stripe = new Stripe('sk_test_xxxxx');
    Users = dataSource.getRepository(UserEntity);
    eventsService = new Mock<EventsService>()
      .setup((x) => x.emit(It.IsAny()))
      .returns()
      .object();

    usersService = new UsersService(Users, createUserFactory());
    service = new StripeWebhookService(stripe, usersService, eventsService);
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

  it('will throw a BadRequestException if the signature is invalid', async () => {
    await Users.save(userData);
    await expect(
      service.handleWebhookEvent(
        JSON.stringify(StripeSubscriptionCanceledEvent),
        'InvalidSignature',
      ),
    ).rejects.toThrow(BadRequestException);
    const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();

    const saved = await Users.findOneByOrFail({ id: UserId });
    expect(saved.accountTier).toBe(AccountTier.Pro);
    expect(eventSpy).not.toHaveBeenCalled();
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

  it('will handle a membership cancelation event', async () => {
    const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
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

    expect(eventSpy).toHaveBeenCalled();
    expect(eventSpy.mock.calls[0][0]).toMatchObject({
      key: EventKey.MembershipCanceled,
      previousTier: AccountTier.Pro,
      previousTierName: 'Pro Membership',
    });
  });

  describe('when handling entitlements changes', () => {
    it('will handle a change in account tier', async () => {
      const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.ShopOwner)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.ShopOwner);
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0]).toMatchObject({
        key: EventKey.MembershipChanged,
        newTier: AccountTier.ShopOwner,
        newTierName: 'Show Owner Membership',
        previousTier: AccountTier.Pro,
        previousTierName: 'Pro Membership',
      });
    });

    it('will handle a new membership activation', async () => {
      const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
      userData.accountTier = AccountTier.Basic;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.Pro)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0]).toMatchObject({
        key: EventKey.MembershipCreated,
        newTier: AccountTier.Pro,
        newTierName: 'Pro Membership',
      });
    });

    it('will handle a membership cancelation', async () => {
      const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.Basic)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Basic);
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('will do nothing if the entitlement changes do not indicate a change to account tier', async () => {
      const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(getEntitlementsChangedEvent(AccountTier.Pro)),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(eventSpy).not.toHaveBeenCalled();
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
      const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(StripeInvoiceFinalizedEvent),
        TestSignature,
      );

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0]).toMatchObject({
        amounts: { due: 20, paid: 0, remaining: 20 },
        currency: 'USD',
        downloadUrl:
          'https://pay.stripe.com/invoice/acct_1PktwnI1ADsIvyhF/test_YWNjdF8xUGt0d25JMUFEc0l2eWhGLF9RclBhSjVsWUViQlBrTWo5ZHdPREtZNlpISHVXdGpOLDExNzA0MDk4NQ0200Rhcub439/pdf?s=ap',
        invoiceDate: new Date('1970-01-20T23:35:00.185Z'),
        items: [
          {
            description: '(created by Stripe CLI)',
            quantity: 1,
            total: 20,
            unitPrice: 20,
          },
        ],
        key: EventKey.MembershipInvoiceCreated,
        period: {
          end: new Date('1970-01-20T23:35:00.184Z'),
          start: new Date('1970-01-20T23:35:00.184Z'),
        },
        totals: { discounts: 0, subtotal: 20, taxes: 0, total: 20 },
      });
    });
  });

  describe('when handling payment issue events', () => {
    it('will handle an action required event', async () => {
      const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(StripePaymentActionRequiredEvent),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0]).toMatchObject({
        amountDue: 20,
        currency: 'usd',
        dueDate: new Date('1970-01-01T00:00:00.000Z'),
        key: EventKey.MembershipPaymentFailed,
      });
    });

    it('will handle a payment failed event', async () => {
      const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
      userData.accountTier = AccountTier.Pro;
      await Users.save(userData);

      await service.handleWebhookEvent(
        JSON.stringify(StripePaymentFailedEvent),
        TestSignature,
      );

      const saved = await Users.findOneByOrFail({ id: UserId });
      expect(saved.accountTier).toBe(AccountTier.Pro);
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0]).toMatchObject({
        amountDue: 20,
        currency: 'usd',
        dueDate: new Date('1970-01-01T00:00:00.000Z'),
        key: EventKey.MembershipPaymentFailed,
      });
    });
  });

  it('will handle a trial-will-end event', async () => {
    const eventSpy = jest.spyOn(eventsService, 'emit').mockReturnValue();
    userData.accountTier = AccountTier.Pro;
    await Users.save(userData);

    await service.handleWebhookEvent(
      JSON.stringify(StripeTrialWillEndEvent),
      TestSignature,
    );

    const saved = await Users.findOneByOrFail({ id: UserId });
    expect(saved.accountTier).toBe(AccountTier.Pro);
    expect(eventSpy).toHaveBeenCalled();
    expect(eventSpy.mock.calls[0][0]).toMatchObject({
      currentTier: AccountTier.Pro,
      currentTierName: 'Pro Membership',
      endDate: new Date('2024-09-17T14:43:00.000Z'),
      key: EventKey.MembershipTrialEnding,
    });
  });
});
