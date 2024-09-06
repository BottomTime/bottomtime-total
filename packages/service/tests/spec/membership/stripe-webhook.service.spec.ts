import { SQSClient } from '@aws-sdk/client-sqs';

import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { StripeWebhookService } from '../../../src/membership/stripe-webhook.service';
import { Queue } from '../../../src/queue';
import { QueueService } from '../../../src/queue/queue.service';
import { UsersService } from '../../../src/users';
import { dataSource } from '../../data-source';
import { StripeSubscriptionCanceledEvent } from '../../fixtures/stripe-events';

describe('Stripe webhook handler service', () => {
  let stripe: Stripe;
  let sqsClient: SQSClient;
  let usersService: UsersService;
  let service: StripeWebhookService;

  let Users: Repository<UserEntity>;

  beforeAll(() => {
    stripe = new Stripe('sk_test_xxxxx');
    sqsClient = new SQSClient();

    Users = dataSource.getRepository(UserEntity);

    usersService = new UsersService(Users);
    service = new StripeWebhookService(
      stripe,
      usersService,
      new Queue(
        new QueueService(sqsClient),
        'http://localhost:9324/queue/default',
      ),
    );
  });

  it('will handle a subscription cancelation', async () => {
    await service.onSubscriptionCanceled(StripeSubscriptionCanceledEvent);
  });
});
