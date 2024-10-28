import { Queues } from '../common';
import { InjectQueue, Queue } from '../queue';

export class EmailNotificationsHandler {
  constructor(@InjectQueue(Queues.email) private readonly emailQueue: Queue) {}
}
