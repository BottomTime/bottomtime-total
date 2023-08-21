import { SuperAgentStatic } from 'superagent';
import {
  DiveSite,
  DiveSiteCreator,
  DiveSiteData,
  DiveSiteDataSchema,
  DiveSiteFullSchema,
} from './interfaces';
import { Depth } from '@/constants';
import { assertValid } from '@/helpers';

export class DefaultDiveSite implements DiveSite {
  private deleted = false;

  constructor(
    private readonly agent: SuperAgentStatic,
    private data: DiveSiteData,
    private dirty = false,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get createdOn(): Date {
    return this.data.createdOn;
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn;
  }

  get creator(): DiveSiteCreator {
    return this.data.creator;
  }

  get averageRating(): number {
    return this.data.averageRating;
  }

  get averageDifficulty(): number {
    return this.data.averageDifficulty;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
    this.dirty = true;
  }

  get description(): string | undefined {
    return this.data.description;
  }
  set description(value: string | undefined) {
    this.data.description = value;
    this.dirty = true;
  }

  get depth(): Depth | undefined {
    return this.data.depth;
  }
  set depth(value: Depth | undefined) {
    this.data.depth = value;
    this.dirty = true;
  }

  get location(): string {
    return this.data.location;
  }
  set location(value: string) {
    this.data.location = value;
    this.dirty = true;
  }

  get directions(): string | undefined {
    return this.data.directions;
  }
  set directions(value: string | undefined) {
    this.data.directions = value;
    this.dirty = true;
  }

  get gps(): { lat: number; lon: number } | undefined {
    return this.data.gps;
  }
  set gps(value: { lat: number; lon: number } | undefined) {
    this.data.gps = value;
    this.dirty = true;
  }

  get freeToDive(): boolean | undefined {
    return this.data.freeToDive;
  }
  set freeToDive(value: boolean | undefined) {
    this.data.freeToDive = value;
    this.dirty = true;
  }

  get shoreAccess(): boolean | undefined {
    return this.data.shoreAccess;
  }
  set shoreAccess(value: boolean | undefined) {
    this.data.shoreAccess = value;
    this.dirty = true;
  }

  get isDirty(): boolean {
    return this.dirty;
  }

  get isDeleted(): boolean {
    return this.deleted;
  }

  async save(): Promise<void> {
    const data = assertValid(this.data, DiveSiteDataSchema);
    const { body: response } = await this.agent
      .put(`/api/diveSites/${this.data.id}`)
      .send(data);

    this.data = assertValid<DiveSiteData>(response, DiveSiteFullSchema);
    this.dirty = false;
    this.deleted = false;
  }

  async delete(): Promise<void> {
    await this.agent.delete(`/api/diveSites/${this.data.id}`);
    this.deleted = true;
  }
}
