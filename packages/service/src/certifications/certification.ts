import { CertificationDTO } from '@bottomtime/api';
import { CertificationDocument } from '../schemas';

export class Certification {
  constructor(private readonly data: CertificationDocument) {}

  get id(): string {
    return this.data._id;
  }

  get course(): string {
    return this.data.course;
  }
  set course(value: string) {
    this.data.course = value;
  }

  get agency(): string {
    return this.data.agency;
  }
  set agency(value: string) {
    this.data.agency = value;
  }

  async save(): Promise<void> {
    await this.data.save();
  }

  async delete(): Promise<boolean> {
    const { deletedCount } = await this.data.deleteOne();
    return deletedCount > 0;
  }

  toJSON(): CertificationDTO {
    return {
      id: this.id,
      course: this.course,
      agency: this.agency,
    };
  }
}
