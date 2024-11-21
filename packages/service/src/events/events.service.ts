import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EventData } from './event-types';

export interface IEventsService {
  emit(event: EventData): void;
}

@Injectable()
export class EventsService implements IEventsService {
  constructor(private readonly emitter: EventEmitter2) {}

  emit(event: EventData) {
    this.emitter.emit(event.key, event);
  }
}
