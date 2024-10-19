import { v7 as uuid } from 'uuid';

import { IQueue } from '../../src/queue';

export class TestQueue implements IQueue {
  private _messages: string[];

  constructor() {
    this._messages = [];
  }

  get messages(): string[] {
    return [...this._messages];
  }

  add(payload: string): Promise<string | undefined> {
    this._messages.push(payload);
    return Promise.resolve(uuid());
  }

  clear(): void {
    this._messages = [];
  }
}
