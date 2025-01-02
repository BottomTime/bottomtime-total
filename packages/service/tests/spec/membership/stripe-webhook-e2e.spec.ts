import { AccountTier } from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Server } from 'http';
import Stripe from 'stripe';
import request from 'supertest';
import { Repository } from 'typeorm';

import { Config } from '../../../src/config';
import { UserEntity } from '../../../src/data';
import { EventsService } from '../../../src/events';
import { StripeWebhookController } from '../../../src/membership/stripe-webhook.controller';
import { StripeWebhookService } from '../../../src/membership/stripe-webhook.service';
import { UsersModule, UsersService } from '../../../src/users';
import { dataSource } from '../../data-source';
import { getEntitlementsChangedEvent } from '../../fixtures/stripe-events';
import { createTestApp, createTestUser } from '../../utils';

const UserData: Partial<UserEntity> = {
  id: '7f73a521-ea15-4f4f-801e-c9b8ddd794fc',
  accountTier: AccountTier.Pro,
  name: 'Suzy',
  email: 'suzy@gmail.com',
  emailLowered: 'suzy@gmail.com',
  emailVerified: true,
  username: 'suzy',
  usernameLowered: 'suzy',
  stripeCustomerId: 'cus_QmXFUbI33k0i4V',
};

describe('Stripe webhook controller', () => {
  let app: INestApplication;
  let server: Server;
  let stripe: Stripe;
  let Users: Repository<UserEntity>;
  let usersService: UsersService;
  let service: StripeWebhookService;
  let events: EventsService;

  let user: UserEntity;

  beforeAll(async () => {
    stripe = new Stripe('sk_test_xxxxx');
    Users = dataSource.getRepository(UserEntity);
    usersService = new UsersService(Users);
    events = new EventsService(new EventEmitter2());
    service = new StripeWebhookService(stripe, usersService, events);
    app = await createTestApp(
      {
        imports: [UsersModule],
        providers: [StripeWebhookService],
        controllers: [StripeWebhookController],
      },
      {
        provide: StripeWebhookService,
        use: service,
      },
    );
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    user = createTestUser(UserData);
    await Users.save(user);
  });

  afterAll(async () => {
    await app.close();
  });

  it('will process a call from Stripe', async () => {
    const signature = 'abcd1234';
    const event = getEntitlementsChangedEvent(AccountTier.Basic);
    const webhookSpy = jest
      .spyOn(stripe.webhooks, 'constructEventAsync')
      .mockImplementation(async (payload) =>
        JSON.parse(
          typeof payload === 'string' ? payload : payload.toString('utf-8'),
        ),
      );
    const eventSpy = jest.spyOn(events, 'emit');

    await request(server)
      .post('/api/stripe')
      .set('stripe-signature', signature)
      .send(event)
      .expect(200);

    expect(webhookSpy).toHaveBeenCalledWith(
      JSON.stringify(event),
      signature,
      Config.stripe.webhookSigningSecret,
    );

    const saved = await Users.findOneByOrFail({ id: user.id });
    expect(saved.accountTier).toBe(AccountTier.Basic);
    expect(eventSpy).not.toHaveBeenCalled();
  });

  it('will return a 400 response if the message payload is missing', async () => {
    await request(server)
      .post('/api/stripe')
      .set('stripe-signature', 'blah')
      .expect(400);
  });
});
