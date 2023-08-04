import { SuperAgentStatic } from 'superagent';
import { DiveSite, DiveSiteCreator, DiveSiteData } from './interfaces';
import { DiveSiteSchema, DiveSiteUpdateSchema } from './validation';

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
    const json = DiveSiteUpdateSchema.validate(this.data).value;
    const { body: response } = await this.agent
      .put(`/api/diveSites/${this.data.id}`)
      .send(json);

    this.data = DiveSiteSchema.validate(response).value;
    this.dirty = false;
    this.deleted = false;
  }

  async delete(): Promise<void> {
    await this.agent.delete(`/api/diveSites/${this.data.id}`);
    this.deleted = true;
  }
}
