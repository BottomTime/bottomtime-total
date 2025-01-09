import { Message } from '@aws-sdk/client-sqs';
import { faker } from '@faker-js/faker';

export function createQueueMessages(count: number): Message[] {
  return Array.from({ length: count }, () => ({
    MessageId: faker.string.uuid(),
    Body: JSON.stringify({
      entity: faker.helpers.arrayElement(['diveSite', 'operator']),
      id: faker.string.uuid(),
    }),
    ReceiptHandle: faker.string.uuid(),
  }));
}
