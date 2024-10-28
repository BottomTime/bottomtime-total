import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EventData } from './event-data';

@Injectable()
export class EventsService {
  constructor(private readonly emitter: EventEmitter2) {}

  emit(event: EventData) {
    this.emitter.emit(event.type, event);
  }
}
