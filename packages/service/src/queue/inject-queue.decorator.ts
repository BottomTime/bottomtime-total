import { Inject } from '@nestjs/common';

export const InjectQueue = (queue: symbol) => Inject(queue);
