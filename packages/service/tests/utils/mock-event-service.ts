import { EventData, IEventsService } from '../../src/events';

export class MockEventsService implements IEventsService {
  private _events: EventData[] = [];

  clear() {
    this._events = [];
  }

  emit(event: EventData): void {
    this._events.push(event);
  }

  get events(): readonly EventData[] {
    return this._events;
  }
}
