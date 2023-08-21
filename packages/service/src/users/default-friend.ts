import { FriendDocument } from '../data';
import { Friend, Profile } from './interfaces';

export class DefaultFriend implements Friend {
  constructor(
    private readonly friendData: FriendDocument,
    private readonly friendProfile: Profile,
  ) {}

  get friend(): Profile {
    return this.friendProfile;
  }

  get friendsSince(): Date {
    return this.friendData.friendsSince;
  }

  toJSON(): Record<string, unknown> {
    return {
      friend: this.friend.toJSON(),
      friendSince: this.friendsSince,
    };
  }
}
