import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  queueMessage(queue: string, payload: string) {}
}
