import { Client } from 'pg';

export class Aggregator {
  constructor(private readonly client: Client) {}
}
