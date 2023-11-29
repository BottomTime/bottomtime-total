import { ProfileDTO } from '@bottomtime/api';
import { UserDocument } from '../schemas/user.document';

export class Profile {
  constructor(private readonly data: UserDocument) {}

  toJSON(): ProfileDTO {
    return {
      memberSince: this.data.memberSince,
      userId: this.data._id,
      username: this.data.username,
    };
  }
}
