import { QueueService } from './queue.service';

export interface IQueue {
  add(payload: string): Promise<string | undefined>;
}

export class Queue implements IQueue {
  constructor(
    private readonly service: QueueService,
    private readonly queueUrl: string,
  ) {}

  async add(payload: string): Promise<string | undefined> {
    return await this.service.addMessage(this.queueUrl, payload);
  }
}
